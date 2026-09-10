import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    buildResourceMetadataUrl,
    canonicalizeResourceUri,
    getMcpResourceConfig,
    McpResourceConfigError,
    resourceUriMatches,
} from '@/lib/mcp/oauth-resource';

const originalEnv = { ...process.env };

beforeEach(() => {
    process.env.AUTHGEAR_ENDPOINT = 'https://issuer.test.example';
    process.env.MCP_RESOURCE_URI = 'https://skytest.test.example/api/mcp';
});

afterEach(() => {
    process.env = { ...originalEnv };
});

describe('resource URI canonicalization', () => {
    it('strips trailing slashes', () => {
        expect(canonicalizeResourceUri('https://a.example/api/mcp/')).toBe('https://a.example/api/mcp');
        expect(canonicalizeResourceUri('https://a.example/api/mcp///')).toBe('https://a.example/api/mcp');
        expect(canonicalizeResourceUri('  https://a.example/api/mcp  ')).toBe('https://a.example/api/mcp');
    });

    it('treats the trailing-slash form as the same resource', () => {
        expect(resourceUriMatches('https://a.example/api/mcp', 'https://a.example/api/mcp/')).toBe(true);
    });

    it('still distinguishes different hosts and paths', () => {
        expect(resourceUriMatches('https://a.example/api/mcp', 'https://b.example/api/mcp')).toBe(false);
        expect(resourceUriMatches('https://a.example/api/mcp', 'https://a.example/api/other')).toBe(false);
        expect(resourceUriMatches('https://a.example/api/mcp', 'http://a.example/api/mcp')).toBe(false);
    });
});

describe('resource metadata URL', () => {
    it('places the resource path after the well-known prefix', () => {
        expect(buildResourceMetadataUrl('https://skytest.test.example/api/mcp')).toBe(
            'https://skytest.test.example/.well-known/oauth-protected-resource/api/mcp'
        );
    });

    it('omits the path segment for an origin-only resource', () => {
        expect(buildResourceMetadataUrl('https://skytest.test.example')).toBe(
            'https://skytest.test.example/.well-known/oauth-protected-resource'
        );
    });
});

describe('resource configuration validation', () => {
    it('returns the canonical resource and issuer', () => {
        process.env.MCP_RESOURCE_URI = 'https://skytest.test.example/api/mcp/';

        const config = getMcpResourceConfig();

        expect(config.resourceUri).toBe('https://skytest.test.example/api/mcp');
        expect(config.issuer).toBe('https://issuer.test.example');
        expect(config.metadataUrl).toBe(
            'https://skytest.test.example/.well-known/oauth-protected-resource/api/mcp'
        );
    });

    it('rejects a missing resource URI', () => {
        delete process.env.MCP_RESOURCE_URI;
        expect(() => getMcpResourceConfig()).toThrow(McpResourceConfigError);
    });

    it('rejects a missing issuer', () => {
        delete process.env.AUTHGEAR_ENDPOINT;
        expect(() => getMcpResourceConfig()).toThrow(McpResourceConfigError);
    });

    it('rejects a relative resource URI', () => {
        process.env.MCP_RESOURCE_URI = '/api/mcp';
        expect(() => getMcpResourceConfig()).toThrow(/absolute URL/);
    });

    it('rejects a non-http scheme', () => {
        process.env.MCP_RESOURCE_URI = 'ftp://skytest.test.example/api/mcp';
        expect(() => getMcpResourceConfig()).toThrow(/http or https/);
    });

    it('rejects a query string or fragment', () => {
        process.env.MCP_RESOURCE_URI = 'https://skytest.test.example/api/mcp?x=1';
        expect(() => getMcpResourceConfig()).toThrow(/query string or fragment/);

        process.env.MCP_RESOURCE_URI = 'https://skytest.test.example/api/mcp#frag';
        expect(() => getMcpResourceConfig()).toThrow(/query string or fragment/);
    });

    it('rejects plain http on a non-loopback host', () => {
        process.env.MCP_RESOURCE_URI = 'http://skytest.test.example/api/mcp';
        expect(() => getMcpResourceConfig()).toThrow(/must use https/);
    });

    it('allows loopback http outside production only', () => {
        process.env.MCP_RESOURCE_URI = 'http://localhost:3000/api/mcp';
        expect(getMcpResourceConfig().resourceUri).toBe('http://localhost:3000/api/mcp');
    });
});
