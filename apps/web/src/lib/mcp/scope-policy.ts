export const MCP_SCOPES = {
    read: 'read:tools',
    write: 'write:tools',
    execute: 'execute:tools',
} as const;

export type McpScope = typeof MCP_SCOPES[keyof typeof MCP_SCOPES];

export const MCP_SUPPORTED_SCOPES: readonly McpScope[] = [
    MCP_SCOPES.read,
    MCP_SCOPES.write,
    MCP_SCOPES.execute,
];

type ToolScopeRule = {
    scopes: readonly McpScope[];
    argumentScopes?: (args: Record<string, unknown>) => readonly McpScope[];
};

const READ: readonly McpScope[] = [MCP_SCOPES.read];
const WRITE: readonly McpScope[] = [MCP_SCOPES.read, MCP_SCOPES.write];
const EXECUTE: readonly McpScope[] = [MCP_SCOPES.read, MCP_SCOPES.execute];

const TOOL_SCOPE_RULES: Record<string, ToolScopeRule> = {
    list_projects: { scopes: READ },
    get_project: { scopes: READ },
    list_test_cases: { scopes: READ },
    get_test_case: { scopes: READ },
    list_test_runs: { scopes: READ },
    list_runner_inventory: { scopes: READ },
    get_test_run: { scopes: READ },
    get_project_test_summary: { scopes: READ },
    get_run_session: { scopes: READ },
    list_run_sessions: { scopes: READ },

    manage_project_configs: { scopes: WRITE },
    create_test_case: { scopes: WRITE },
    delete_test_case: { scopes: WRITE },
    update_test_case: {
        scopes: WRITE,
        // cancel_and_save cancels queued/running runs, so saving that way is also an execution
        // control and must not be reachable with write consent alone.
        argumentScopes: (args) => (
            args.activeRunResolution === 'cancel_and_save' ? [MCP_SCOPES.execute] : []
        ),
    },

    run_test_case: { scopes: EXECUTE },
    run_test_group: { scopes: EXECUTE },
    stop_all_runs: { scopes: EXECUTE },
    stop_all_queues: { scopes: EXECUTE },
};

export function isKnownMcpTool(toolName: string): boolean {
    return Object.hasOwn(TOOL_SCOPE_RULES, toolName);
}

export function getRequiredScopesForTool(
    toolName: string,
    args: Record<string, unknown> = {}
): readonly McpScope[] | null {
    const rule = TOOL_SCOPE_RULES[toolName];
    if (!rule) {
        return null;
    }

    const argumentScopes = rule.argumentScopes?.(args) ?? [];
    return [...new Set([...rule.scopes, ...argumentScopes])];
}

export function getScopePolicyToolNames(): readonly string[] {
    return Object.keys(TOOL_SCOPE_RULES);
}

export function hasRequiredScopes(
    grantedScopes: readonly string[],
    requiredScopes: readonly McpScope[]
): boolean {
    return requiredScopes.every((scope) => grantedScopes.includes(scope));
}

export function getMissingScopes(
    grantedScopes: readonly string[],
    requiredScopes: readonly McpScope[]
): readonly McpScope[] {
    return requiredScopes.filter((scope) => !grantedScopes.includes(scope));
}
