import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { isProjectMember } from '@/lib/security/permissions';
import { getMissingScopes, getRequiredScopesForTool, type McpScope } from '@/lib/mcp/scope-policy';

export type McpHandlerExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

export function getUserId(extra: McpHandlerExtra): string | null {
    const userId = extra.authInfo?.extra?.skytestUserId;
    return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

export function getGrantedScopes(extra: McpHandlerExtra): readonly string[] {
    return extra.authInfo?.scopes ?? [];
}

export class McpScopeError extends Error {
    constructor(readonly missingScopes: readonly McpScope[]) {
        super(`Missing required scope: ${missingScopes.join(' ')}`);
    }
}

/**
 * Defence in depth behind the transport-level check in the route. A tool absent from the scope
 * policy fails closed here rather than running unauthorized.
 */
export function assertToolScopes(
    extra: McpHandlerExtra,
    toolName: string,
    args: Record<string, unknown> = {}
): void {
    const requiredScopes = getRequiredScopesForTool(toolName, args);
    if (!requiredScopes) {
        throw new McpScopeError([]);
    }

    const missingScopes = getMissingScopes(getGrantedScopes(extra), requiredScopes);
    if (missingScopes.length > 0) {
        throw new McpScopeError(missingScopes);
    }
}

export async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
    return isProjectMember(userId, projectId);
}
