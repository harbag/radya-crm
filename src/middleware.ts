import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase isn't configured (e.g. env vars not set on the host), don't
  // crash every request with a 500 (MIDDLEWARE_INVOCATION_FAILED). Let the
  // request through so the app can render and surface a clearer error.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[middleware] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — skipping auth check.'
    )
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh the session — do NOT use getSession() here (not safe in middleware)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname.startsWith('/login')

    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // Never let a transient Supabase/auth error take down the whole site.
    console.error('[middleware] Auth check failed:', error)
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
