import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

const normalizePhone = (phone: string) => {
  return phone.replace(/[^\d+]/g, '')
}

const getAuthEmail = (identifier: string) => {
  const normalized = normalizePhone(identifier)
  return `phone_${normalized}@innovise.local`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify caller is an agent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'agent' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden: Agents only' }, { status: 403 })
    }

    const body = await request.json()
    const { fullName, phone, service, address } = body

    if (!fullName || !phone || !service) {
      return NextResponse.json({ error: 'Missing full name, phone, or service' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    
    // Generate a secure random password for the new client
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + 'A1!'

    const authEmail = getAuthEmail(phone)

    // Create the user using admin client (bypasses normal signup)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || '',
        address: address || '',
        role: 'client'
      }
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Wait a brief moment for the trigger to fire and create the profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update the profile to set referred_by
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ referred_by: user.id })
      .eq('id', newUser.user.id)

    if (updateError) {
      console.error('Error setting referred_by:', updateError)
      // Non-fatal, they are created but referral linkage failed
    }

    // Insert requested service
    const { error: serviceError } = await adminClient
      .from('services')
      .insert({
        client_id: newUser.user.id,
        service_name: service,
        status: 'consultation',
      })

    if (serviceError) {
      console.error('Error creating service:', serviceError)
    }

    return NextResponse.json({
      success: true,
      client: {
        id: newUser.user.id,
        phone,
        tempPassword
      },
      message: 'Client referred successfully. They can login with their mobile number.'
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
