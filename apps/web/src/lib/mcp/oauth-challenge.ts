import type { McpAuthFailure } from '@/lib/mcp/oauth-auth';
import type { McpScope } from '@/lib/mcp/scope-policy';

function quoteHeaderValue(value: string): string {
    return value.replace(/["\\]/g, '\\$&');
}

function buildChallenge(metadataUrl: string | null, params: Record<string, string>): string {
    const entries = metadataUrl
        ? { resource_metadata: metadataUrl, ...params }
        : params;
    const serialized = Object.entries(entries)
        .map(([key, value]) => `${key}="${quoteHeaderValue(value)}"`)
        .join(', ');
    return serialized ? `Bearer ${serialized}` : 'Bearer';
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string>): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
}

export function unauthorizedResponse(failure: McpAuthFailure, metadataUrl: string | null): Response {
    if (failure.kind === 'server_error') {
        return jsonResponse(500, {
            error: 'server_error',
            error_description: 'MCP authentication is unavailable',
        }, {});
    }

    const isInvalid = failure.kind === 'invalid_token';
    const challenge = buildChallenge(
        metadataUrl,
        isInvalid ? { error: 'invalid_token', error_description: failure.detail } : {}
    );

    return jsonResponse(401, {
        error: isInvalid ? 'invalid_token' : 'unauthorized',
        error_description: isInvalid
            ? failure.detail
            : 'Authorization required. Connect this MCP server with OAuth.',
    }, { 'WWW-Authenticate': challenge });
}

export function insufficientScopeResponse(
    missingScopes: readonly McpScope[],
    requiredScopes: readonly McpScope[],
    metadataUrl: string
): Response {
    const description = `This request requires the ${missingScopes.join(' ')} scope. `
        + 'Reconnect and grant the missing permission.';
    const challenge = buildChallenge(metadataUrl, {
        error: 'insufficient_scope',
        scope: requiredScopes.join(' '),
        error_description: description,
    });

    return jsonResponse(403, {
        error: 'insufficient_scope',
        error_description: description,
        required_scopes: requiredScopes,
        missing_scopes: missingScopes,
    }, { 'WWW-Authenticate': challenge });
}

export function unknownUserResponse(metadataUrl: string): Response {
    const description = 'This account is authenticated but has no SkyTest user. '
        + 'Sign in to the SkyTest website once to finish account setup, then reconnect.';

    return jsonResponse(403, {
        error: 'access_denied',
        error_description: description,
    }, {
        'WWW-Authenticate': buildChallenge(metadataUrl, {
            error: 'access_denied',
            error_description: description,
        }),
    });
}
