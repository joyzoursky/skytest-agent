import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from '@/lib/mcp/server-registry';
import { assertToolScopes, type McpHandlerExtra } from '@/lib/mcp/server-auth';

type ToolHandler = (...handlerArgs: unknown[]) => unknown;

function wrapHandlerWithScopeCheck(toolName: string, handler: unknown): ToolHandler {
    const originalHandler = handler as ToolHandler;

    return (...handlerArgs: unknown[]) => {
        const extra = handlerArgs[handlerArgs.length - 1] as McpHandlerExtra;
        const firstArg = handlerArgs.length > 1 ? handlerArgs[0] : null;
        const args = typeof firstArg === 'object' && firstArg !== null
            ? firstArg as Record<string, unknown>
            : {};

        assertToolScopes(extra, toolName, args);
        return originalHandler(...handlerArgs);
    };
}

/**
 * Applies the scope policy to every tool at registration time. Wrapping here rather than at each
 * registration means a newly added tool cannot silently skip the check, and a tool missing from
 * the policy fails closed. The deprecated `tool()` overloads are patched too: they reach
 * `_createRegisteredTool` without going through `registerTool`, so leaving them alone would leave
 * a way to register an unchecked handler.
 */
function enforceScopesOnRegistration(server: McpServer): void {
    const registerTool = server.registerTool.bind(server);
    const tool = server.tool.bind(server);

    server.registerTool = ((name: string, config: never, handler: never) => (
        registerTool(name, config, wrapHandlerWithScopeCheck(name, handler) as unknown as never)
    )) as typeof server.registerTool;

    server.tool = ((name: string, ...rest: unknown[]) => {
        const handlerIndex = rest.length - 1;
        const wrapped = [...rest];
        wrapped[handlerIndex] = wrapHandlerWithScopeCheck(name, rest[handlerIndex]);
        return (tool as (...args: unknown[]) => ReturnType<typeof tool>)(name, ...wrapped);
    }) as typeof server.tool;
}

export function createMcpServer(): McpServer {
    const server = new McpServer(
        { name: 'skytest-agent', version: '1.0.0' },
        { capabilities: { tools: {} } }
    );

    enforceScopesOnRegistration(server);
    registerMcpTools(server);
    return server;
}
