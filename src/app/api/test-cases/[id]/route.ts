import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const testCase = await prisma.testCase.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                url: true,
                prompt: true,
                username: true,
                password: true,
                projectId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!testCase) {
            return NextResponse.json({ error: 'Test case not found' }, { status: 404 });
        }

        return NextResponse.json(testCase);
    } catch (error) {
        console.error('Failed to fetch test case:', error);
        return NextResponse.json({ error: 'Failed to fetch test case' }, { status: 500 });
    }
}


export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, url, prompt, username, password } = body;

        const testCase = await prisma.testCase.update({
            where: { id },
            data: {
                name,
                url,
                prompt,
                username,
                password,
            },
        });

        return NextResponse.json(testCase);
    } catch (error) {
        console.error('Failed to update test case:', error);
        return NextResponse.json({ error: 'Failed to update test case' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.testCase.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete test case:', error);
        return NextResponse.json({ error: 'Failed to delete test case' }, { status: 500 });
    }
}
