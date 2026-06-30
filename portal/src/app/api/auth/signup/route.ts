import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, phone, address } = body

    if (!phone || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    const normalizedPhone = phone.replace(/[^\d+]/g, '')
    const virtualEmail = `phone_${normalizedPhone}@innovise.local`

    // Create the auth user under the virtual email, pre-confirmed
    const { data: authUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: virtualEmail,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: fullName,
        phone: normalizedPhone,
        address: address || '',
        email: email || null,
        role: 'client'
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Since the database trigger copies user metadata into profiles,
    // let's update public.profiles with the actual email if provided.
    if (email) {
      await adminSupabase
        .from('profiles')
        .update({ email })
        .eq('id', authUser.user.id)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
