import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/calendar',
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};
