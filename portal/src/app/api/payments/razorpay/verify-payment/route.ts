import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json()
    const { invoiceId, razorpayPaymentId, razorpayOrderId, razorpaySignature, mock } = body

    if (!invoiceId || !razorpayPaymentId || !razorpayOrderId) {
      return NextResponse.json({ error: 'Missing required validation fields' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // 3. Verify signature
    if (mock) {
      // Mock verification success for preview/test flow
      console.log('Verifying mock transaction for invoice:', invoiceId)
    } else {
      if (!keySecret) {
        return NextResponse.json({ error: 'Razorpay secret key not configured on server' }, { status: 500 })
      }

      if (!razorpaySignature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex')

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
      }
    }

    // 4. Update invoice status in database
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('client_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
