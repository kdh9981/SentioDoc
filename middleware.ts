import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Check if it's the default domain (or localhost/preview)
  const isDefaultDomain =
    hostname === 'doc.sentio.ltd' ||
    hostname.includes('localhost') ||
    hostname.includes('vercel.app') ||
    hostname.includes('178.16.139.199')

  // Handle custom domains
  if (!isDefaultDomain) {
    // Skip if it's an API call or static asset
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return NextResponse.next()
    }

    const slug = pathname.slice(1)

    // If root path on custom domain, do nothing
    if (pathname === '/') {
      return NextResponse.next()
    }

    // Rewrite to custom domain handler
    const newUrl = new URL('/view/custom-domain-handler', request.url)
    newUrl.searchParams.set('domain', hostname)
    newUrl.searchParams.set('slug', slug)
    return NextResponse.rewrite(newUrl)
  }

  // Reserved paths and static file extensions that should not be treated as slugs
  const reservedPaths = ['/api', '/view', '/auth', '/_next', '/favicon.ico', '/pricing', '/dashboard', '/s']
  const staticFileExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.css', '.js', '.woff', '.woff2', '.ttf']

  const isStaticFile = staticFileExtensions.some(ext => pathname.endsWith(ext))
  const isReserved = reservedPaths.some(p => pathname.startsWith(p)) || pathname === '/' || isStaticFile

  if (!isReserved) {
    const slug = pathname.slice(1)
    const newUrl = new URL('/view/custom-domain-handler', request.url)
    newUrl.searchParams.set('domain', 'DEFAULT')
    newUrl.searchParams.set('slug', slug)
    return NextResponse.rewrite(newUrl)
  }

  // Public paths that don't need auth
  const publicPaths = ['/', '/auth', '/view', '/api', '/_next', '/favicon.ico', '/pricing']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Create Supabase client for auth check
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to signin if no session on protected routes
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
