import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Moderators only get the request-processing workflow and their own
// notification preferences; everything else under /admin is admin-only.
const MODERATOR_ALLOWED_PREFIXES = ['/admin/requests', '/admin/notifications'];

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/calendar',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        if (!token) return false;
        const role = (token as any).role ?? 'user';
        if (role === 'admin') return true;
        if (role === 'moderator') {
          const path = req.nextUrl.pathname;
          return MODERATOR_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
        }
        return false;
      },
    },
  },
);

export const config = {
  matcher: ['/admin/:path*'],
};
