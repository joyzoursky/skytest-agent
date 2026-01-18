import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getTargetUrl(request: Request): { targetUrl: string | null; errorResponse?: NextResponse } {
  const appUrl = new URL(request.url);
  const targetUrl = appUrl.searchParams.get('url');
  if (!targetUrl) {
    return {
      targetUrl: null,
      errorResponse: NextResponse.json({ error: 'Missing url' }, { status: 400 })
    };
  }

  const endpoint = process.env.NEXT_PUBLIC_AUTHGEAR_ENDPOINT;
  if (!endpoint) {
    return {
      targetUrl: null,
      errorResponse: NextResponse.json({ error: 'Auth endpoint not configured' }, { status: 500 })
    };
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return {
      targetUrl: null,
      errorResponse: NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    };
  }

  const allowedOrigin = new URL(endpoint).origin;
  if (parsedTarget.origin !== allowedOrigin) {
    return {
      targetUrl: null,
      errorResponse: NextResponse.json({ error: 'Blocked url' }, { status: 400 })
    };
  }

  return { targetUrl: parsedTarget.toString() };
}

async function proxy(request: Request): Promise<NextResponse> {
  const { targetUrl, errorResponse } = getTargetUrl(request);
  if (!targetUrl || errorResponse) return errorResponse!;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('cookie');
  headers.delete('content-length');

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual'
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('set-cookie');
  responseHeaders.delete('content-encoding');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  return proxy(request);
}

export async function PUT(request: Request) {
  return proxy(request);
}

export async function PATCH(request: Request) {
  return proxy(request);
}

export async function DELETE(request: Request) {
  return proxy(request);
}
