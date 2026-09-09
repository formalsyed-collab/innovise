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

    const trimmed = identifier.trim()
    const cleaned = trimmed.replace(/[\s\-()]/g, '')
    const rawDigits = identifier.replace(/\D/g, '')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Search profiles by email or exact phone first
    let matchedProfiles: any[] = []

    if (trimmed.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, phone, role')
        .ilike('email', trimmed.toLowerCase())
        .limit(5)
      matchedProfiles = data || []
    } else {
      // Prioritize EXACT phone match in DB
      const { data: exactMatches } = await supabase
        .from('profiles')
        .select('id, email, phone, role')
        .or(`phone.eq.${cleaned},phone.eq.${rawDigits}`)

      if (exactMatches && exactMatches.length > 0) {
        matchedProfiles = exactMatches
      } else if (rawDigits.length >= 10) {
        // Fallback only if no exact match exists
        const last10 = rawDigits.slice(-10)
        const { data: fallbackMatches } = await supabase
          .from('profiles')
          .select('id, email, phone, role')
          .or(`phone.eq.${last10},phone.eq.91${last10},phone.eq.+91${last10}`)
        matchedProfiles = fallbackMatches || []
      }
    }

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
