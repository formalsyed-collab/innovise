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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = path === '/login' || path === '/forgot-password' || path === '/reset-password' || path.startsWith('/agent/login') || path.startsWith('/agent/register')

  // Helper function to redirect while preserving the exact cookie options
  const redirectWithCookies = (url: URL) => {
    const redirectRes = NextResponse.redirect(url)
    // Only apply the cookies that Supabase explicitly refreshed or set, with their original options (path, maxAge, etc)
    cookiesToSet.forEach(({ name, value, options }) => {
      redirectRes.cookies.set(name, value, options)
    })
    return redirectRes
  }

  if (
    !user &&
    !isAuthPage &&
    path !== '/' &&
    !path.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    
    if (path.startsWith('/agent')) {
      url.pathname = '/agent/login'
    } else {
      url.pathname = '/login'
    }
    
    return redirectWithCookies(url)
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role

    if (path === '/' || isAuthPage) {
      const url = request.nextUrl.clone()
      if (role === 'admin') url.pathname = '/admin'
      else if (role === 'agent') url.pathname = '/agent/dashboard'
      else if (path.startsWith('/agent')) url.pathname = '/agent/dashboard'
      else url.pathname = '/dashboard'
      return redirectWithCookies(url)
    }

    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'agent' ? '/agent/dashboard' : '/dashboard'
      return redirectWithCookies(url)
    }

    if (path.startsWith('/dashboard') && role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return redirectWithCookies(url)
    }
    
    if (path.startsWith('/dashboard') && role === 'agent') {
      const url = request.nextUrl.clone()
      url.pathname = '/agent/dashboard'
      return redirectWithCookies(url)
    }
  }

  return supabaseResponse
}
