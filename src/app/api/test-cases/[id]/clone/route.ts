import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createLogger } from '@/lib/logger';
import { getFilePath, getUploadPath } from '@/lib/file-security';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const logger = createLogger('api:test-cases:clone');

export const dynamic = 'force-dynamic';

type AuthPayload = NonNullable<Awaited<ReturnType<typeof verifyAuth>>>;

async function resolveUserId(authPayload: AuthPayload): Promise<string | null> {
    const maybeUserId = (authPayload as { userId?: unknown }).userId;
    if (typeof maybeUserId === 'string' && maybeUserId.length > 0) {
        return maybeUserId;
    }

    const authId = authPayload.sub as string | undefined;
    if (!authId) return null;
    const user = await prisma.user.findUnique({ where: { authId }, select: { id: true } });
    return user?.id ?? null;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authPayload = await verifyAuth(request);
    if (!authPayload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const existingTestCase = await prisma.testCase.findUnique({
            where: { id },
            include: {
                project: { select: { userId: true } },
                files: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!existingTestCase) {
            return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }

        const userId = await resolveUserId(authPayload);
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (existingTestCase.project.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const clonedTestCase = await prisma.testCase.create({
            data: {
                name: `${existingTestCase.name} (Copy)`,
                url: existingTestCase.url,
                prompt: existingTestCase.prompt,
                steps: existingTestCase.steps,
                browserConfig: existingTestCase.browserConfig,
                username: existingTestCase.username,
                password: existingTestCase.password,
                projectId: existingTestCase.projectId,
                displayId: existingTestCase.displayId,
                status: 'DRAFT',
            },
        });

        // Clone attached files (DB records + physical files)
        if (existingTestCase.files && existingTestCase.files.length > 0) {
            const newUploadDir = getUploadPath(clonedTestCase.id);
            await fs.mkdir(newUploadDir, { recursive: true });

            for (const file of existingTestCase.files) {
                const ext = path.extname(file.storedName) || path.extname(file.filename) || '';
                const newStoredName = `${crypto.randomUUID()}${ext}`;

                const src = getFilePath(existingTestCase.id, file.storedName);
                const dest = getFilePath(clonedTestCase.id, newStoredName);

                try {
                    await fs.copyFile(src, dest);
                } catch (e) {
                    logger.warn('clone: failed to copy file on disk, skipping', { testCaseId: existingTestCase.id, fileId: file.id, src, dest, error: e });
                    continue;
                }

                await prisma.testCaseFile.create({
                    data: {
                        testCaseId: clonedTestCase.id,
                        filename: file.filename,
                        storedName: newStoredName,
                        mimeType: file.mimeType,
                        size: file.size,
                    }
                });
            }
        }

        return NextResponse.json(clonedTestCase);
    } catch (error) {
        logger.error('Failed to clone test case', error);
        return NextResponse.json({ error: 'Failed to clone test case' }, { status: 500 });
    }
}
