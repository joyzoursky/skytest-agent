import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { createLogger } from '@/lib/core/logger';
import {
    getMcpResourceConfig,
    resourceUriMatches,
    type McpResourceConfig,
} from '@/lib/mcp/oauth-resource';

const logger = createLogger('mcp:oauth');

const DISCOVERY_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_TIMEOUT_MS = 5_000;
const SUPPORTED_ALGORITHMS = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256'];

export interface McpPrincipal {
    subject: string;
    clientId: string;
    scopes: readonly string[];
    token: string;
    expiresAt?: number;
}

export type McpAuthFailure =
    | { kind: 'missing_token' }
    | { kind: 'invalid_token'; description: string }
    | { kind: 'server_error' };

export type McpAuthResult =
    | { ok: true; principal: McpPrincipal; resource: McpResourceConfig }
    | { ok: false; failure: McpAuthFailure; resource: McpResourceConfig | null };

interface DiscoveryDocument {
    issuer: string;
    jwksUri: string;
}

interface CachedDiscovery {
    document: DiscoveryDocument;
    jwks: ReturnType<typeof createRemoteJWKSet>;
    expiresAtMs: number;
}

const discoveryCache = new Map<string, CachedDiscovery>();

export function __resetMcpOauthCachesForTests(): void {
    discoveryCache.clear();
}

async function fetchDiscoveryDocument(issuer: string): Promise<DiscoveryDocument> {
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(DISCOVERY_TIMEOUT_MS),
    });

    if (!response.ok) {
        throw new Error(`discovery request failed with status ${response.status}`);
    }

    const payload = await response.json() as Record<string, unknown>;
    const advertisedIssuer = typeof payload.issuer === 'string' ? payload.issuer : '';
    const jwksUri = typeof payload.jwks_uri === 'string' ? payload.jwks_uri : '';

    if (!advertisedIssuer || !resourceUriMatches(advertisedIssuer, issuer)) {
        throw new Error(`discovery issuer "${advertisedIssuer}" does not match configured issuer`);
    }
    if (!jwksUri) {
        throw new Error('discovery document does not advertise a jwks_uri');
    }

    return { issuer: advertisedIssuer, jwksUri };
}

async function getDiscovery(issuer: string): Promise<CachedDiscovery> {
    const cached = discoveryCache.get(issuer);
    if (cached && cached.expiresAtMs > Date.now()) {
        return cached;
    }

    const document = await fetchDiscoveryDocument(issuer);
    const entry: CachedDiscovery = {
        document,
        jwks: createRemoteJWKSet(new URL(document.jwksUri), {
            timeoutDuration: DISCOVERY_TIMEOUT_MS,
        }),
        expiresAtMs: Date.now() + DISCOVERY_TTL_MS,
    };
    discoveryCache.set(issuer, entry);
    return entry;
}

export function getBearerToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
        return null;
    }

    const [scheme, ...parts] = authHeader.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || parts.length !== 1) {
        return null;
    }

    return parts[0] || null;
}

export function parseScopeClaim(payload: JWTPayload): readonly string[] {
    const raw = payload.scope;
    if (typeof raw !== 'string') {
        return [];
    }

    return raw.split(/\s+/).filter((scope) => scope.length > 0);
}

function audienceMatchesResource(payload: JWTPayload, resourceUri: string): boolean {
    const audience = payload.aud;
    if (typeof audience === 'string') {
        return resourceUriMatches(audience, resourceUri);
    }
    if (Array.isArray(audience)) {
        return audience.some((entry) => typeof entry === 'string' && resourceUriMatches(entry, resourceUri));
    }
    return false;
}

function getClientId(payload: JWTPayload): string | null {
    const clientId = (payload as { client_id?: unknown }).client_id;
    return typeof clientId === 'string' && clientId.length > 0 ? clientId : null;
}

export async function authenticateMcpRequest(request: Request): Promise<McpAuthResult> {
    let resource: McpResourceConfig;
    try {
        resource = getMcpResourceConfig();
    } catch (error) {
        logger.error('MCP OAuth resource configuration is invalid', error);
        return { ok: false, failure: { kind: 'server_error' }, resource: null };
    }

    const token = getBearerToken(request);
    if (!token) {
        return { ok: false, failure: { kind: 'missing_token' }, resource };
    }

    let discovery: CachedDiscovery;
    try {
        discovery = await getDiscovery(resource.issuer);
    } catch (error) {
        logger.error('MCP OAuth discovery failed', error);
        return { ok: false, failure: { kind: 'server_error' }, resource };
    }

    let payload: JWTPayload;
    try {
        ({ payload } = await jwtVerify(token, discovery.jwks, {
            issuer: discovery.document.issuer,
            algorithms: SUPPORTED_ALGORITHMS,
            requiredClaims: ['exp', 'sub'],
        }));
    } catch (error) {
        // jose interpolates unverified header content into its messages and validates `crit`
        // before the signature, so this text is attacker-controlled. Log it, never return it.
        logger.debug('MCP OAuth token rejected', {
            reason: error instanceof Error ? error.message : 'token verification failed',
        });
        return {
            ok: false,
            failure: { kind: 'invalid_token', description: 'token verification failed' },
            resource,
        };
    }

    if (!audienceMatchesResource(payload, resource.resourceUri)) {
        logger.debug('MCP OAuth token rejected for audience mismatch');
        return {
            ok: false,
            failure: { kind: 'invalid_token', description: 'token audience does not match this resource' },
            resource,
        };
    }

    const subject = typeof payload.sub === 'string' ? payload.sub : '';
    if (!subject) {
        return {
            ok: false,
            failure: { kind: 'invalid_token', description: 'token has no subject' },
            resource,
        };
    }

    const clientId = getClientId(payload);
    if (!clientId) {
        return {
            ok: false,
            failure: { kind: 'invalid_token', description: 'token has no client_id claim' },
            resource,
        };
    }

    return {
        ok: true,
        resource,
        principal: {
            subject,
            clientId,
            scopes: parseScopeClaim(payload),
            token,
            expiresAt: typeof payload.exp === 'number' ? payload.exp : undefined,
        },
    };
}
