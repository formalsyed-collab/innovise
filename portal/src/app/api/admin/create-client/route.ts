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
    const { email, password, fullName, phone, address } = body

    if (!phone || !password || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Initialize admin client with SERVICE_ROLE_KEY to register user
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

    // 4. Create auth user in Supabase using virtual email
    const normalizedPhone = phone.replace(/[^\d+]/g, '')
    const virtualEmail = `phone_${normalizedPhone}@innovise.local`

    const createUserParams: any = {
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
    }

    const { data: authUser, error: createError } = await adminSupabase.auth.admin.createUser(createUserParams)

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Update real email in profile table if provided
    if (email) {
      await adminSupabase
        .from('profiles')
        .update({ email })
        .eq('id', authUser.user.id)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: email || null,
        phone: normalizedPhone
      }
    }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
