import { buildProtectedResourceMetadataResponse } from '@/lib/mcp/oauth-metadata';

export const dynamic = 'force-dynamic';

export async function GET() {
    return buildProtectedResourceMetadataResponse();
}
