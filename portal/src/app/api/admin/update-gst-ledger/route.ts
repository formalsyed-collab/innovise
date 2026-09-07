import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller and ensure Admin role
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 })
    }

    // 2. Parse payload
    const body = await request.json()
    const { clientId, gstLedger } = body

    if (!clientId || !gstLedger) {
      return NextResponse.json({ error: 'Missing clientId or gstLedger data' }, { status: 400 })
    }

    // 3. Fetch existing profile bank_details
    const { data: clientProfile, error: clientFetchError } = await supabase
      .from('profiles')
      .select('id, bank_details')
      .eq('id', clientId)
      .single()

    if (clientFetchError || !clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    const currentBankDetails = (clientProfile.bank_details && typeof clientProfile.bank_details === 'object')
      ? clientProfile.bank_details
      : {}

    const updatedGstLedger = {
      ...gstLedger,
      updated_at: new Date().toISOString(),
      updated_by_name: adminProfile.full_name || 'Innovise Compliance Officer'
    }

    const updatedBankDetails = {
      ...currentBankDetails,
      gst_ledger: updatedGstLedger
    }

    // 4. Update profile in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ bank_details: updatedBankDetails })
      .eq('id', clientId)
      .select('id, bank_details')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      gst_ledger: updatedGstLedger,
      message: 'GST portal ledger successfully updated and synced to client dashboard.'
    }, { status: 200 })

  } catch (err: any) {
    console.error('Error updating GST ledger:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
