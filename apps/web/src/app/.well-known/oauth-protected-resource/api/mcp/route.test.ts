import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const { GET } = await import('@/app/.well-known/oauth-protected-resource/api/mcp/route');

const originalEnv = { ...process.env };

beforeEach(() => {
    process.env.AUTHGEAR_ENDPOINT = 'https://issuer.test.example';
    process.env.MCP_RESOURCE_URI = 'https://skytest.test.example/api/mcp';
});

afterEach(() => {
    process.env = { ...originalEnv };
});

describe('protected resource metadata', () => {
    it('publishes the configured resource and authorization server', async () => {
        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            resource: 'https://skytest.test.example/api/mcp',
            authorization_servers: ['https://issuer.test.example'],
            scopes_supported: ['openid', 'offline_access', 'read:tools', 'write:tools', 'execute:tools'],
            bearer_methods_supported: ['header'],
        });
    });

    it('advertises openid, without which Authgear rejects the authorization request', async () => {
        const payload = await (await GET()).json();

        // Clients build their scope request from this list, so omitting these breaks the login
        // flow before any token is ever issued.
        expect(payload.scopes_supported).toContain('openid');
        expect(payload.scopes_supported).toContain('offline_access');
    });

    it('is publicly cacheable and needs no credentials', async () => {
        const response = await GET();

        expect(response.headers.get('Cache-Control')).toContain('public');
    });

    it('never derives the resource from a request host', async () => {
        process.env.MCP_RESOURCE_URI = 'https://canonical.test.example/api/mcp';

        const payload = await (await GET()).json();

        expect(payload.resource).toBe('https://canonical.test.example/api/mcp');
    });

    it('fails loudly when the resource is not configured', async () => {
        delete process.env.MCP_RESOURCE_URI;

        const response = await GET();

        expect(response.status).toBe(500);
        expect(await response.json()).toMatchObject({ error: 'server_error' });
    });
});
