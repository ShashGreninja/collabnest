import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  // There is no MODERATOR role in the database schema. Protect this route tree
  // until a real role is introduced rather than trusting a client-set cookie.
  if (pathname.startsWith('/moderator')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*', '/moderator/:path*'] };
