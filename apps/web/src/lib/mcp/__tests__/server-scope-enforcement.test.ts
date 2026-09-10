import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { MCP_SCOPES } from '@/lib/mcp/scope-policy';

const mocks = vi.hoisted(() => ({
    listProjects: vi.fn(),
    createTestCase: vi.fn(),
    runTestCase: vi.fn(),
}));

vi.mock('@/lib/mcp/server-tools', () => ({
    listProjectsTool: mocks.listProjects,
    getProjectTool: vi.fn(),
    listTestCasesTool: vi.fn(),
    getTestCaseTool: vi.fn(),
    runTestCaseTool: mocks.runTestCase,
    listTestRunsTool: vi.fn(),
    manageProjectConfigsTool: vi.fn(),
    listRunnerInventoryTool: vi.fn(),
    stopAllRunsTool: vi.fn(),
    stopAllQueuesTool: vi.fn(),
    deleteTestCaseTool: vi.fn(),
    getTestRunTool: vi.fn(),
    getProjectTestSummaryTool: vi.fn(),
}));

vi.mock('@/lib/mcp/test-case-mutation-tools', () => ({
    registerTestCaseMutationTools: (server: {
        registerTool: (name: string, config: unknown, handler: unknown) => void;
    }) => {
        server.registerTool('create_test_case', { description: 'stub' }, mocks.createTestCase);
        server.registerTool('update_test_case', { description: 'stub' }, vi.fn());
    },
}));

vi.mock('@/lib/mcp/run-session-tools', () => ({
    getRunSessionTool: vi.fn(),
    listRunSessionsTool: vi.fn(),
    runTestGroupTool: vi.fn(),
}));

const { createMcpServer } = await import('@/lib/mcp/server');

async function connectClient(scopes: readonly string[]) {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const authInfo = {
        token: 'test-token',
        clientId: 'dcrc_client',
        scopes: [...scopes],
        extra: { skytestUserId: 'user-1' },
    };
    const send = clientTransport.send.bind(clientTransport);
    clientTransport.send = (message, options) => send(message, { ...options, authInfo });

    await server.connect(serverTransport);
    const client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
    return client;
}

beforeEach(() => {
    mocks.listProjects.mockReset();
    mocks.createTestCase.mockReset();
    mocks.runTestCase.mockReset();

    const ok = { content: [{ type: 'text', text: '{}' }] };
    mocks.listProjects.mockResolvedValue(ok);
    mocks.createTestCase.mockResolvedValue(ok);
    mocks.runTestCase.mockResolvedValue(ok);
});

describe('tool-level scope enforcement', () => {
    it('runs a read tool with read consent', async () => {
        const client = await connectClient([MCP_SCOPES.read]);

        await client.callTool({ name: 'list_projects', arguments: {} });

        expect(mocks.listProjects).toHaveBeenCalled();
    });

    it('blocks a mutation tool when write consent is missing', async () => {
        const client = await connectClient([MCP_SCOPES.read]);

        const result = await client.callTool({ name: 'create_test_case', arguments: {} });

        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toContain('write:tools');
        expect(mocks.createTestCase).not.toHaveBeenCalled();
    });

    it('blocks an execution tool when execute consent is missing', async () => {
        const client = await connectClient([MCP_SCOPES.read, MCP_SCOPES.write]);

        const result = await client.callTool({ name: 'run_test_case', arguments: { testCaseId: 'tc-1' } });

        expect(result.isError).toBe(true);
        expect(mocks.runTestCase).not.toHaveBeenCalled();
    });

    it('runs a mutation tool once write consent is granted', async () => {
        const client = await connectClient([MCP_SCOPES.read, MCP_SCOPES.write]);

        await client.callTool({ name: 'create_test_case', arguments: {} });

        expect(mocks.createTestCase).toHaveBeenCalled();
    });
});
