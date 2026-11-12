import { NextResponse, type NextRequest } from 'next/server.js';
import { sessionCookieName } from '@codeddevs/auth-contract';
import { getApiOrigin } from './api-origin.mjs';
import { getTrustedClientIp } from './src/lib/trusted-client-ip.ts';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    const destination = new URL(getApiOrigin(process.env.API_INTERNAL_ORIGIN));
    destination.pathname = pathname;
    destination.search = request.nextUrl.search;
    const clientIp = getTrustedClientIp(request.headers);
    if (process.env.NODE_ENV === 'production' && !clientIp) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.delete('x-forwarded-for');
    forwardedHeaders.delete('x-real-ip');
    forwardedHeaders.delete('cf-connecting-ip');
    if (clientIp) forwardedHeaders.set('x-forwarded-for', clientIp);
    return NextResponse.rewrite(destination, {
      request: { headers: forwardedHeaders },
    });
  }
  // Cookie presence is a navigation hint only. Express validates every session.
  const hasCookie = Boolean(
    request.cookies.get(sessionCookieName(process.env.NODE_ENV))?.value,
  );
  const protectedRoots = [
    '/dashboard',
    '/website-content',
    '/insights',
    '/settings',
    '/inquiries',
  ];
  const protectedRoute = protectedRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
  if (protectedRoute && !hasCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
  // Never bounce /login solely on cookie presence: stale cookies must reach /me.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/website-content/:path*',
    '/insights/:path*',
    '/settings/:path*',
    '/inquiries/:path*',
    '/login',
  ],
};
