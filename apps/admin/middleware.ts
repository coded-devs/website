import { NextResponse, type NextRequest } from 'next/server';
import { getApiOrigin } from './api-origin.mjs';

export function middleware(request: NextRequest) {
  const destination = new URL(getApiOrigin(process.env.API_INTERNAL_ORIGIN));
  destination.pathname = request.nextUrl.pathname;
  destination.search = request.nextUrl.search;
  return NextResponse.rewrite(destination);
}

export const config = { matcher: '/api/:path*' };
