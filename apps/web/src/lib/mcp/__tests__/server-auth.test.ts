import { describe, expect, it } from 'vitest';
import {
    assertToolScopes,
    getGrantedScopes,
    getUserId,
    McpScopeError,
    type McpHandlerExtra,
} from '@/lib/mcp/server-auth';
import { MCP_SCOPES } from '@/lib/mcp/scope-policy';

function extraWith(authInfo: unknown): McpHandlerExtra {
    return { authInfo } as unknown as McpHandlerExtra;
}

const fullyScoped = {
    clientId: 'dcrc_client',
    scopes: [MCP_SCOPES.read, MCP_SCOPES.write, MCP_SCOPES.execute],
    extra: { skytestUserId: 'user-1' },
};

describe('getUserId', () => {
    it('reads the internal user id from authInfo.extra', () => {
        expect(getUserId(extraWith(fullyScoped))).toBe('user-1');
    });

    it('does not fall back to the OAuth client id', () => {
        const extra = extraWith({ clientId: 'dcrc_client', scopes: [], extra: {} });

        expect(getUserId(extra)).toBeNull();
    });

    it('returns null without auth info', () => {
        expect(getUserId(extraWith(undefined))).toBeNull();
    });

    it('ignores a non-string user id', () => {
        expect(getUserId(extraWith({ extra: { skytestUserId: 42 } }))).toBeNull();
        expect(getUserId(extraWith({ extra: { skytestUserId: '' } }))).toBeNull();
    });
});

describe('getGrantedScopes', () => {
    it('returns the token scopes', () => {
        expect(getGrantedScopes(extraWith(fullyScoped))).toEqual([
            MCP_SCOPES.read,
            MCP_SCOPES.write,
            MCP_SCOPES.execute,
        ]);
    });

    it('returns an empty list without auth info', () => {
        expect(getGrantedScopes(extraWith(undefined))).toEqual([]);
    });
});

describe('assertToolScopes', () => {
    it('passes when every required scope is granted', () => {
        expect(() => assertToolScopes(extraWith(fullyScoped), 'run_test_case')).not.toThrow();
    });

    it('throws for a mutation without write consent', () => {
        const extra = extraWith({ ...fullyScoped, scopes: [MCP_SCOPES.read] });

        expect(() => assertToolScopes(extra, 'create_test_case')).toThrow(McpScopeError);
    });

    it('reports the missing scopes', () => {
        const extra = extraWith({ ...fullyScoped, scopes: [MCP_SCOPES.read] });

        try {
            assertToolScopes(extra, 'run_test_case');
            expect.unreachable('expected a scope error');
        } catch (error) {
            expect(error).toBeInstanceOf(McpScopeError);
            expect((error as McpScopeError).missingScopes).toEqual([MCP_SCOPES.execute]);
        }
    });

    it('escalates update_test_case when it cancels active runs', () => {
        const extra = extraWith({ ...fullyScoped, scopes: [MCP_SCOPES.read, MCP_SCOPES.write] });

        expect(() => assertToolScopes(extra, 'update_test_case', { name: 'renamed' })).not.toThrow();
        expect(() => assertToolScopes(extra, 'update_test_case', {
            activeRunResolution: 'cancel_and_save',
        })).toThrow(McpScopeError);
    });

    it('fails closed for a tool missing from the policy', () => {
        expect(() => assertToolScopes(extraWith(fullyScoped), 'unregistered_tool')).toThrow(McpScopeError);
    });
});
