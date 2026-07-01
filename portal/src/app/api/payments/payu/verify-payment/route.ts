import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // CASE 1: JSON payload (Mock flow from front-end)
    if (contentType.includes('application/json')) {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
      }

      const body = await request.json()
      const { invoiceId, mock } = body

      if (!invoiceId || !mock) {
        return NextResponse.json({ error: 'Invalid mock validation request' }, { status: 400 })
      }

      // Update invoice to paid
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
    }

    // CASE 2: Form payload (Direct redirect callback from PayU)
    const formData = await request.formData()
    const status = formData.get('status') as string // 'success', 'failure'
    const txnid = formData.get('txnid') as string
    const amount = formData.get('amount') as string
    const productinfo = formData.get('productinfo') as string
    const firstname = formData.get('firstname') as string
    const email = formData.get('email') as string
    const key = formData.get('key') as string
    const payuHash = formData.get('hash') as string
    const salt = process.env.PAYU_MERCHANT_SALT?.trim()
    const udf1 = formData.get('udf1') as string

    if (!txnid || !payuHash || !status || !udf1) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed&reason=missing_payload', request.url))
    }

    const invoiceId = udf1

    if (!salt) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed&reason=server_misconfiguration', request.url))
    }

    // Calculate reverse hash to verify signature:
    // salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    const reverseHashString = `${salt}|${status}|||||||||${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`
    const calculatedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex')

    if (calculatedHash !== payuHash) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed&reason=signature_invalid', request.url))
    }

    if (status === 'success') {
      const supabase = await createClient()
      
      // Update invoice status to Paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (updateError) {
        return NextResponse.redirect(new URL(`/dashboard?payment=failed&reason=${encodeURIComponent(updateError.message)}`, request.url))
      }

      return NextResponse.redirect(new URL('/dashboard?payment=success', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', request.url))
    }

  } catch (error: any) {
    return NextResponse.redirect(new URL(`/dashboard?payment=error&message=${encodeURIComponent(error.message)}`, request.url))
  }
}
