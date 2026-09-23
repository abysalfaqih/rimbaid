// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )

  // getUser() memvalidasi token langsung ke server Supabase Auth.
  // JANGAN ganti dengan getSession() di sini — itu tidak selalu
  // memverifikasi ulang token, jadi lebih mudah dipalsukan.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isLoginRoute = pathname === '/admin/login'

  if (isAdminRoute && !isLoginRoute && !user) {
    return {
      supabaseResponse: redirectWithCookies(request, supabaseResponse, '/admin/login'),
      user,
    }
  }

  if (isLoginRoute && user) {
    return {
      supabaseResponse: redirectWithCookies(request, supabaseResponse, '/admin/dashboard'),
      user,
    }
  }

  return { supabaseResponse, user }
}

// Redirect tanpa kehilangan cookie sesi yang baru saja di-refresh Supabase
function redirectWithCookies(
  request: NextRequest,
  sourceResponse: NextResponse,
  pathname: string
) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = pathname
  const redirectResponse = NextResponse.redirect(redirectUrl)
  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })
  return redirectResponse
}