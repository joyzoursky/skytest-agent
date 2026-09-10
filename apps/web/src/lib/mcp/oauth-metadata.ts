import { getMcpResourceConfig, McpResourceConfigError } from '@/lib/mcp/oauth-resource';
import { MCP_SUPPORTED_SCOPES } from '@/lib/mcp/scope-policy';
import { createLogger } from '@/lib/core/logger';

const logger = createLogger('mcp:metadata');

/**
 * Clients build their authorization request from this list, so it has to carry the OIDC scopes
 * as well as ours. Authgear rejects an authorization request that omits `openid` outright, and
 * without `offline_access` no refresh token is issued, which would force re-authentication every
 * time the access token expires.
 */
const ADVERTISED_SCOPES = ['openid', 'offline_access', ...MCP_SUPPORTED_SCOPES];

export function buildProtectedResourceMetadataResponse(): Response {
    try {
        const { resourceUri, issuer } = getMcpResourceConfig();
        return new Response(JSON.stringify({
            resource: resourceUri,
            authorization_servers: [issuer],
            scopes_supported: ADVERTISED_SCOPES,
            bearer_methods_supported: ['header'],
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        if (error instanceof McpResourceConfigError) {
            logger.error('Protected resource metadata unavailable', error);
            return new Response(JSON.stringify({
                error: 'server_error',
                error_description: 'MCP resource metadata is not configured',
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        throw error;
    }
}
