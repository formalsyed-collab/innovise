import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const supabase = await createClient()
  
  // Disable caching for auth check
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Fetch user profile role to guide routing
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = new URL(request.url)
    if (profile?.role === 'admin') {
      url.pathname = '/admin'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  const url = new URL(request.url)
  url.pathname = '/login'
  return NextResponse.redirect(url)
}
