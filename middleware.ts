import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const hostname = req.headers.get('host') || '';
        const url = req.nextUrl;

        // Check if it's the default domain (or localhost/preview)
        // Adjust these values based on your actual deployment
        const isDefaultDomain =
            hostname === 'doc.sentio.ltd' ||
            hostname.includes('localhost') ||
            hostname.includes('vercel.app') ||
            hostname.includes('178.16.139.199'); // VPS IP

        if (isDefaultDomain) {
            // Check for root-level slugs: /twitter
            // Exclude reserved paths
            const reservedPaths = ['/api', '/view', '/auth', '/_next', '/favicon.ico', '/pricing'];
            const isReserved = reservedPaths.some(p => url.pathname.startsWith(p)) || url.pathname === '/';

            if (!isReserved) {
                const slug = url.pathname.slice(1);
                const newUrl = new URL('/view/custom-domain-handler', req.url);
                newUrl.searchParams.set('domain', 'DEFAULT');
                newUrl.searchParams.set('slug', slug);
                return NextResponse.rewrite(newUrl);
            }
        } else {
            // It's a custom domain!
            // e.g. go.hey.com/twitter -> hostname=go.hey.com, pathname=/twitter

            // Skip if it's an API call or static asset (should be handled by matcher, but double check)
            if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
                return NextResponse.next();
            }

            const slug = url.pathname.slice(1); // remove leading slash

            // If root path on custom domain, do nothing (or redirect to main site)
            if (url.pathname === '/') {
                return NextResponse.next();
            }

            // Rewrite to custom domain handler
            const newUrl = new URL('/view/custom-domain-handler', req.url);
            newUrl.searchParams.set('domain', hostname);
            newUrl.searchParams.set('slug', slug);
            return NextResponse.rewrite(newUrl);
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const path = req.nextUrl.pathname;
                const hostname = req.headers.get('host') || '';

                // Custom domains are always public
                const isDefaultDomain =
                    hostname === 'doc.sentio.ltd' ||
                    hostname.includes('localhost') ||
                    hostname.includes('vercel.app') ||
                    hostname.includes('178.16.139.199');

                if (!isDefaultDomain) {
                    return true;
                }

                // On default domain:
                // Protect root path (Dashboard)
                if (path === '/') {
                    return !!token;
                }

                // Allow everything else (slugs, api, view, auth, etc.)
                return true;
            },
        },
    }
);

export const config = {
    // Match everything except static files and images
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
