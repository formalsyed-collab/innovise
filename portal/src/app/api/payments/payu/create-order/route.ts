import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

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
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    // 3. Fetch invoice and verify ownership
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('client_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    // 4. Fetch profile for user details (prefill info)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    const key = process.env.PAYU_MERCHANT_KEY
    const salt = process.env.PAYU_MERCHANT_SALT
    const actionUrl = process.env.PAYU_BASE_URL || 'https://test.payu.in/_payment'

    const txnid = `txn_${invoice.id.replace(/-/g, '')}_${Date.now()}`
    const amount = Number(invoice.total).toFixed(2)
    const productinfo = invoice.description || `Invoice payment ${invoice.id}`
    const firstname = profile?.full_name?.split(' ')[0] || 'Client'
    const email = profile?.email || 'client@innovise.in'
    const phone = profile?.phone || ''

    // 5. Check if we should run in mock mode
    if (!key || !salt) {
      return NextResponse.json({
        success: true,
        mock: true,
        txnid,
        amount,
        invoice: {
          id: invoice.id,
          description: invoice.description,
          total: invoice.total
        }
      }, { status: 200 })
    }

    // 6. Generate SHA-512 Hash
    // Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`
    const hash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex')

    // 7. Success Response for live integration
    return NextResponse.json({
      success: true,
      mock: false,
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone,
      hash,
      actionUrl,
      invoice: {
        id: invoice.id,
        description: invoice.description
      }
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
