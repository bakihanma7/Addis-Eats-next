import { NextResponse } from 'next/server';

// Layer 1 of AUTH.md: a fast redirect for visitors with no session cookie.
// It only checks that the cookie EXISTS. It cannot verify the signature (that
// needs node:crypto, which the Edge runtime lacks), so every page, action and
// handler still calls getSession() itself. Never rely on this file alone.
export function middleware(request) {
  if (request.cookies.has('session')) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = request.nextUrl.clone();
  url.pathname = '/signin';
  url.search = '';
  url.searchParams.set('next', pathname + search);
  return NextResponse.redirect(url);
}

// Narrow matcher: only the private routes, so the menu, assets and /api stay untouched.
export const config = {
  matcher: ['/checkout/:path*', '/orders/:path*'],
};
