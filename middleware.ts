import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// null = full access to everything under /admin for this role.
// Moderators get the request-processing workflow + their own notification
// preferences; plain users only get their own notification preferences.
const ADMIN_ALLOWED_PREFIXES: Record<string, string[] | null> = {
  admin: null,
  moderator: ['/admin/requests', '/admin/notifications', '/admin/news'],
  user: ['/admin/notifications'],
};

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
        const allowed = ADMIN_ALLOWED_PREFIXES[role];
        if (allowed === undefined) return false;
        if (allowed === null) return true;
        const path = req.nextUrl.pathname;
        return allowed.some((p) => path === p || path.startsWith(`${p}/`));
      },
    },
  },
);

export const config = {
  matcher: ['/admin/:path*'],
};
