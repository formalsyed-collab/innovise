import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller and check if they are an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 })
    }

    // 2. Parse request payload
    const body = await request.json()
    const { clientId, fullName, phone, email, address } = body

    if (!clientId || !fullName || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedPhone = phone.replace(/[^\d+]/g, '')

    // 3. Check if phone is already registered to another user
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .neq('id', clientId)
      .maybeSingle()

    if (phoneCheckError) throw phoneCheckError
    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered to another client' }, { status: 400 })
    }

    // 4. Initialize admin client with SERVICE_ROLE_KEY to update auth fields
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured on server' }, { status: 500 })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 5. Update auth user login identifiers and metadata
    const virtualEmail = `phone_${normalizedPhone}@innovise.local`
    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(clientId, {
      email: virtualEmail,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
        address: address || '',
        email: email || null
      }
    })

    if (authUpdateError) {
      return NextResponse.json({ error: authUpdateError.message }, { status: 400 })
    }

    // 6. Update database profiles table
    const { error: profileUpdateError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: normalizedPhone,
        email: email || null,
        address: address || null
      })
      .eq('id', clientId)

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
