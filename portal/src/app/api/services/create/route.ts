import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the caller
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json()
    const { serviceName, notes } = body

    if (!serviceName) {
      return NextResponse.json({ error: 'Missing serviceName' }, { status: 400 })
    }

    // 3. Insert using Admin Client to bypass RLS restrictions
    const adminClient = createAdminClient()
    const { data: service, error: insertError } = await adminClient
      .from('services')
      .insert({
        client_id: user.id,
        service_name: serviceName,
        status: 'consultation', // Set to consultation initially
        notes: notes || 'Service initiated by client.'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      service
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
