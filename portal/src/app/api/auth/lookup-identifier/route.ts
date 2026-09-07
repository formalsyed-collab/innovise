import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json()
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
    }

    const trimmed = identifier.trim().toLowerCase()
    const rawDigits = identifier.replace(/\D/g, '')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Search profiles by email or phone
    let query = supabase.from('profiles').select('id, email, phone, role').limit(5)
    
    if (trimmed.includes('@')) {
      query = query.ilike('email', trimmed)
    } else if (rawDigits.length >= 10) {
      const last10 = rawDigits.slice(-10)
      query = query.or(`phone.ilike.%${last10}%,email.ilike.%${last10}%`)
    }

    const { data: matchedProfiles } = await query

    if (matchedProfiles && matchedProfiles.length > 0) {
      const authEmails: string[] = []
      for (const p of matchedProfiles) {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.id)
        if (authUser?.user?.email && !authEmails.includes(authUser.user.email)) {
          authEmails.push(authUser.user.email)
        }
      }
      if (authEmails.length > 0) {
        return NextResponse.json({ authEmails, authEmail: authEmails[0] })
      }
    }

    return NextResponse.json({ authEmails: [], authEmail: null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
