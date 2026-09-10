import { prisma } from '@/lib/core/prisma';

/**
 * Resolves the verified token subject to an existing SkyTest user only. MCP deliberately does not
 * create users or link them by email: account onboarding stays a website flow, so a token for an
 * unknown subject is denied rather than silently provisioned.
 */
export async function resolveMcpUserId(authSubject: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
        where: { authId: authSubject },
        select: { id: true },
    });

    return user?.id ?? null;
}
