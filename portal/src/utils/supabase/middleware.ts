import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Keep track of the cookies that Supabase wants to set
  const cookiesToSet: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            cookiesToSet.push({ name, value, options })
          })
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return supabaseResponse
  }

  const isAuthPage = path === '/login' || path === '/forgot-password' || path === '/reset-password'

  // Helper function to redirect while preserving the exact cookie options
  const redirectWithCookies = (url: URL) => {
    const redirectRes = NextResponse.redirect(url)
    // Only apply the cookies that Supabase explicitly refreshed or set, with their original options (path, maxAge, etc)
    cookiesToSet.forEach(({ name, value, options }) => {
      redirectRes.cookies.set(name, value, options)
    })
    return redirectRes
  }

  // Fast-path: Check if any auth cookie exists before making network calls
  const allCookies = request.cookies.getAll()
  const hasAuthToken = allCookies.some(c => c.name.includes('-auth-token'))

  // If visitor is on an auth page with no auth cookies, skip Supabase calls completely
  if (!hasAuthToken && isAuthPage) {
    return supabaseResponse
  }

  // If visitor is trying to access protected routes with no auth cookies, redirect to login immediately
  if (!hasAuthToken && !isAuthPage && path !== '/' && !path.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectWithCookies(url)
  }

  try {
    // Wrap getUser in a 2500ms timeout race to guarantee Edge Middleware never exceeds Vercel limits
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null }; error: any }>((_, reject) =>
      setTimeout(() => reject(new Error('Auth request timed out')), 2500)
    )

    const { data: { user } } = await Promise.race([authPromise, timeoutPromise])

    if (
      !user &&
      !isAuthPage &&
      path !== '/' &&
      !path.startsWith('/auth')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return redirectWithCookies(url)
    }

    if (user) {
      // Prioritize role from user metadata to save a database round-trip
      let role = user.user_metadata?.role || (user.app_metadata as any)?.role

      if (!role) {
        try {
          const profilePromise = supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          const profileTimeout = new Promise<{ data: null; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Profile query timed out')), 1500)
          )

          const { data: profile } = await Promise.race([profilePromise, profileTimeout])
          role = profile?.role
        } catch {
          role = 'client'
        }
      }

      if (path === '/' || isAuthPage) {
        const url = request.nextUrl.clone()
        if (role === 'admin') url.pathname = '/admin'
        else url.pathname = '/dashboard'
        return redirectWithCookies(url)
      }

      if (path.startsWith('/admin') && role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return redirectWithCookies(url)
      }

      if (path.startsWith('/dashboard') && role === 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return redirectWithCookies(url)
      }
    }
  } catch {
    // If Supabase timed out or errored, allow auth pages or safely redirect to login
    if (!isAuthPage && path !== '/' && !path.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return redirectWithCookies(url)
    }
  }

  return supabaseResponse
}
