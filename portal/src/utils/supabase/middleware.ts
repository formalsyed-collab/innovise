import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // Do not run middleware on static files or API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.')
  ) {
    return supabaseResponse
  }

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = path === '/login' || path === '/forgot-password' || path === '/reset-password' || path.startsWith('/agent/login') || path.startsWith('/agent/register')

  // Redirect to the appropriate login page based on the requested path
  if (
    !user &&
    !isAuthPage &&
    path !== '/' &&
    !path.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    
    // If they were trying to access an agent route, redirect to agent login
    if (path.startsWith('/agent')) {
      url.pathname = '/agent/login'
    } else {
      url.pathname = '/login'
    }
    
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Redirect logged-in users from root or auth pages to their dashboards
    if (path === '/' || isAuthPage) {
      const url = request.nextUrl.clone()
      if (role === 'admin') url.pathname = '/admin'
      else if (role === 'agent') url.pathname = '/agent/dashboard'
      else url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Role boundary checks
    if (path.startsWith('/admin') && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = role === 'agent' ? '/agent/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }

    if (path.startsWith('/dashboard') && role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    if (path.startsWith('/dashboard') && role === 'agent') {
      const url = request.nextUrl.clone()
      url.pathname = '/agent/dashboard'
      return NextResponse.redirect(url)
    }
    
    if (path.startsWith('/agent/dashboard') && role !== 'agent' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
