import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMcpTools } from '@/lib/mcp/server-registry';
import { assertToolScopes, type McpHandlerExtra } from '@/lib/mcp/server-auth';

type ToolHandler = (...handlerArgs: unknown[]) => unknown;

/**
 * Applies the scope policy to every tool at registration time. Wrapping here rather than at each
 * registration means a newly added tool cannot silently skip the check, and a tool missing from
 * the policy fails closed.
 */
function enforceScopesOnRegistration(server: McpServer): void {
    const registerTool = server.registerTool.bind(server);

    server.registerTool = ((name: string, config: never, handler: never) => {
        const originalHandler = handler as unknown as ToolHandler;
        const scopedHandler = (...handlerArgs: unknown[]) => {
            const extra = handlerArgs[handlerArgs.length - 1] as McpHandlerExtra;
            const firstArg = handlerArgs.length > 1 ? handlerArgs[0] : null;
            const args = typeof firstArg === 'object' && firstArg !== null
                ? firstArg as Record<string, unknown>
                : {};

            assertToolScopes(extra, name, args);
            return originalHandler(...handlerArgs);
        };

        return registerTool(name, config, scopedHandler as unknown as never);
    }) as typeof server.registerTool;
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
