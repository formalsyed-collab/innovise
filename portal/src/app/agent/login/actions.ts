'use server'

import { createClient } from '@supabase/supabase-js'

export async function lookupEmailByPhone(phone: string) {
  if (!phone) return null

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const normalized = phone.replace(/[^\d+]/g, '')
  const withoutPlus91 = normalized.startsWith('+91') ? normalized.slice(3) : normalized
  const withPlus91 = `+91${withoutPlus91}`

  const phoneFormats = [
    normalized,
    withoutPlus91,
    withPlus91
  ]

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .in('phone', phoneFormats)
    .in('role', ['agent', 'admin'])
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.email) {
    return null
  }

  return data.email
}
