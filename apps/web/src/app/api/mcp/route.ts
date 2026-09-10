import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/mcp/server';
import { authenticateMcpRequest } from '@/lib/mcp/oauth-auth';
import {
    insufficientScopeResponse,
    unauthorizedResponse,
    unknownUserResponse,
} from '@/lib/mcp/oauth-challenge';
import { getRequiredScopesForBody } from '@/lib/mcp/oauth-request-scopes';
import { resolveMcpUserId } from '@/lib/mcp/oauth-user';
import { getMissingScopes } from '@/lib/mcp/scope-policy';
import { createLogger } from '@/lib/core/logger';

const logger = createLogger('api:mcp');
const SLOW_MCP_REQUEST_THRESHOLD_MS = 2_000;

export const dynamic = 'force-dynamic';

function replayRequest(request: Request, body: string | null): Request {
    if (body === null) {
        return request;
    }

    return new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body,
    });
}

async function handleMcpRequest(request: Request): Promise<Response> {
    const startedAtMs = Date.now();
    let authResolvedAtMs = startedAtMs;
    let serverConnectedAtMs = startedAtMs;
    try {
        const auth = await authenticateMcpRequest(request);
        if (!auth.ok) {
            return unauthorizedResponse(auth.failure, auth.resource?.metadataUrl ?? null);
        }

        const { principal, resource } = auth;
        const userId = await resolveMcpUserId(principal.subject);
        if (!userId) {
            logger.warn('MCP request denied for unknown SkyTest user', { clientId: principal.clientId });
            return unknownUserResponse(resource.metadataUrl);
        }
        authResolvedAtMs = Date.now();

        const rawBody = request.method === 'POST' ? await request.text() : null;
        let parsedBody: unknown = null;
        if (rawBody) {
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {
                parsedBody = null;
            }
        }

        const requiredScopes = getRequiredScopesForBody(parsedBody);
        const missingScopes = getMissingScopes(principal.scopes, requiredScopes);
        if (missingScopes.length > 0) {
            return insufficientScopeResponse(missingScopes, requiredScopes, resource.metadataUrl);
        }

        const server = createMcpServer();
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        await server.connect(transport);
        serverConnectedAtMs = Date.now();
        let response: Response;
        try {
            response = await transport.handleRequest(replayRequest(request, rawBody), {
                authInfo: {
                    token: principal.token,
                    clientId: principal.clientId,
                    scopes: [...principal.scopes],
                    expiresAt: principal.expiresAt,
                    resource: new URL(resource.resourceUri),
                    extra: { skytestUserId: userId },
                },
            });
        } finally {
            await server.close();
        }
        const completedAtMs = Date.now();
        const authLatencyMs = authResolvedAtMs - startedAtMs;
        const setupLatencyMs = serverConnectedAtMs - authResolvedAtMs;
        const handleLatencyMs = completedAtMs - serverConnectedAtMs;
        const totalLatencyMs = completedAtMs - startedAtMs;
        if (totalLatencyMs >= SLOW_MCP_REQUEST_THRESHOLD_MS) {
            logger.warn('Slow MCP request', {
                method: request.method,
                authLatencyMs,
                setupLatencyMs,
                handleLatencyMs,
                totalLatencyMs,
            });
        } else {
            logger.debug('MCP request handled', {
                method: request.method,
                authLatencyMs,
                setupLatencyMs,
                handleLatencyMs,
                totalLatencyMs,
            });
        }
        return response;
    } catch (error) {
        logger.error('MCP request failed', error);
        return new Response(JSON.stringify({ error: 'MCP request failed' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function GET(request: Request) { return handleMcpRequest(request); }
export async function POST(request: Request) { return handleMcpRequest(request); }
export async function DELETE(request: Request) { return handleMcpRequest(request); }
