import { getAuthgearRuntimeConfig } from '@/lib/security/authgear-config';

export interface McpResourceConfig {
    resourceUri: string;
    issuer: string;
    metadataUrl: string;
}

export class McpResourceConfigError extends Error {}

const RESOURCE_METADATA_PREFIX = '/.well-known/oauth-protected-resource';

function isLoopbackHostname(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

function isDevelopment(): boolean {
    return process.env.NODE_ENV !== 'production';
}

function parseAbsoluteUri(value: string, settingName: string): URL {
    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        throw new McpResourceConfigError(`${settingName} must be an absolute URL, received "${value}"`);
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new McpResourceConfigError(`${settingName} must use http or https, received "${parsed.protocol}"`);
    }

    if (parsed.protocol === 'http:' && !(isDevelopment() && isLoopbackHostname(parsed.hostname))) {
        throw new McpResourceConfigError(
            `${settingName} must use https; plain http is only allowed for loopback hosts in development`
        );
    }

    if (parsed.hash || parsed.search) {
        throw new McpResourceConfigError(`${settingName} must not contain a query string or fragment`);
    }

    return parsed;
}

/**
 * Authgear echoes the resource identifier into the `aud` claim, but whether it preserves the
 * registered form or appends a trailing slash is not guaranteed. Comparing canonical forms keeps
 * validation exact on scheme, host and path while tolerating that one difference.
 */
export function canonicalizeResourceUri(value: string): string {
    return value.trim().replace(/\/+$/, '');
}

export function resourceUriMatches(expected: string, actual: string): boolean {
    return canonicalizeResourceUri(expected) === canonicalizeResourceUri(actual);
}

export function buildResourceMetadataUrl(resourceUri: string): string {
    const parsed = new URL(resourceUri);
    const resourcePath = canonicalizeResourceUri(parsed.pathname);
    return `${parsed.origin}${RESOURCE_METADATA_PREFIX}${resourcePath}`;
}

export function getMcpResourceConfig(): McpResourceConfig {
    const { endpoint, mcpResourceUri } = getAuthgearRuntimeConfig();

    if (!mcpResourceUri) {
        throw new McpResourceConfigError('MCP_RESOURCE_URI is not configured');
    }
    if (!endpoint) {
        throw new McpResourceConfigError('AUTHGEAR_ENDPOINT is not configured');
    }

    const resource = parseAbsoluteUri(mcpResourceUri, 'MCP_RESOURCE_URI');
    const issuer = parseAbsoluteUri(endpoint, 'AUTHGEAR_ENDPOINT');

    const resourceUri = canonicalizeResourceUri(resource.toString());

    return {
        resourceUri,
        issuer: canonicalizeResourceUri(issuer.toString()),
        metadataUrl: buildResourceMetadataUrl(resourceUri),
    };
}
