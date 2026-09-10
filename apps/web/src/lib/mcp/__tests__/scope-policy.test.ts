import { describe, expect, it, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from '@/lib/mcp/server-registry';
import {
    getMissingScopes,
    getRequiredScopesForTool,
    getScopePolicyToolNames,
    hasRequiredScopes,
    isKnownMcpTool,
    MCP_SCOPES,
} from '@/lib/mcp/scope-policy';

function collectRegisteredToolNames(): string[] {
    const names: string[] = [];
    const server = { registerTool: vi.fn((name: string) => { names.push(name); }) };
    registerMcpTools(server as unknown as McpServer);
    return names;
}

describe('scope policy coverage', () => {
    it('classifies every registered MCP tool', () => {
        const registered = collectRegisteredToolNames();

        expect(registered.length).toBeGreaterThan(0);
        const unclassified = registered.filter((name) => !isKnownMcpTool(name));
        expect(unclassified).toEqual([]);
    });

    it('does not classify tools that are not registered', () => {
        const registered = new Set(collectRegisteredToolNames());

        const stale = getScopePolicyToolNames().filter((name) => !registered.has(name));
        expect(stale).toEqual([]);
    });

    it('requires the read scope for every tool', () => {
        for (const name of getScopePolicyToolNames()) {
            expect(getRequiredScopesForTool(name)).toContain(MCP_SCOPES.read);
        }
    });

    it('fails closed for an unclassified tool', () => {
        expect(getRequiredScopesForTool('not_a_registered_tool')).toBeNull();
    });
});

describe('scope policy rules', () => {
    it('keeps read tools free of write and execute requirements', () => {
        expect(getRequiredScopesForTool('list_projects')).toEqual([MCP_SCOPES.read]);
        expect(getRequiredScopesForTool('get_run_session')).toEqual([MCP_SCOPES.read]);
    });

    it('requires write for mutations', () => {
        expect(getRequiredScopesForTool('create_test_case')).toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
        expect(getRequiredScopesForTool('delete_test_case')).toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
        expect(getRequiredScopesForTool('manage_project_configs')).toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
    });

    it('requires execute for run and stop tools', () => {
        for (const name of ['run_test_case', 'run_test_group', 'stop_all_runs', 'stop_all_queues']) {
            expect(getRequiredScopesForTool(name)).toEqual([MCP_SCOPES.read, MCP_SCOPES.execute]);
        }
    });

    it('escalates update_test_case to execute only when it cancels active runs', () => {
        expect(getRequiredScopesForTool('update_test_case', { name: 'renamed' }))
            .toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
        expect(getRequiredScopesForTool('update_test_case', { activeRunResolution: 'do_not_save' }))
            .toEqual([MCP_SCOPES.read, MCP_SCOPES.write]);
        expect(getRequiredScopesForTool('update_test_case', { activeRunResolution: 'cancel_and_save' }))
            .toEqual([MCP_SCOPES.read, MCP_SCOPES.write, MCP_SCOPES.execute]);
    });

    it('does not let write-only consent trigger a cancellation', () => {
        const granted = [MCP_SCOPES.read, MCP_SCOPES.write];
        const required = getRequiredScopesForTool('update_test_case', {
            activeRunResolution: 'cancel_and_save',
        });

        expect(required).not.toBeNull();
        expect(hasRequiredScopes(granted, required!)).toBe(false);
        expect(getMissingScopes(granted, required!)).toEqual([MCP_SCOPES.execute]);
    });

    it('ignores granted scopes it does not define', () => {
        const granted = ['openid', 'offline_access', MCP_SCOPES.read];

        expect(hasRequiredScopes(granted, [MCP_SCOPES.read])).toBe(true);
        expect(hasRequiredScopes(granted, [MCP_SCOPES.write])).toBe(false);
    });
});
