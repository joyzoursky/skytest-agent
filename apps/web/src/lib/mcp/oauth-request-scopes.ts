import { getRequiredScopesForTool, MCP_SCOPES, type McpScope } from '@/lib/mcp/scope-policy';

const BASELINE_SCOPES: readonly McpScope[] = [MCP_SCOPES.read];

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function getScopesForSingleMessage(message: unknown): readonly McpScope[] {
    const record = asRecord(message);
    if (!record || record.method !== 'tools/call') {
        return BASELINE_SCOPES;
    }

    const params = asRecord(record.params);
    const toolName = typeof params?.name === 'string' ? params.name : '';
    if (!toolName) {
        return BASELINE_SCOPES;
    }

    const args = asRecord(params?.arguments) ?? {};
    // An unrecognized tool name keeps the read baseline so the SDK can answer with its own
    // tool-not-found error instead of a scope challenge that would imply the tool exists.
    return getRequiredScopesForTool(toolName, args) ?? BASELINE_SCOPES;
}

/**
 * Malformed or unparsable bodies fall back to the read baseline so the SDK stays responsible for
 * protocol-level errors; a scope challenge must not stand in for a JSON-RPC parse error.
 */
export function getRequiredScopesForBody(parsedBody: unknown): readonly McpScope[] {
    const messages = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    const required = new Set<McpScope>(BASELINE_SCOPES);

    for (const message of messages) {
        for (const scope of getScopesForSingleMessage(message)) {
            required.add(scope);
        }
    }

    return [...required];
}
