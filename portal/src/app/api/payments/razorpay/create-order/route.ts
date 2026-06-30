import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

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

    // 3. Fetch invoice and verify it belongs to this client
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

    const amountInPaise = Math.round(Number(invoice.total) * 100)

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // 4. Fallback to mock mode if Razorpay credentials are not defined
    if (!keyId || !keySecret) {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`
      return NextResponse.json({
        success: true,
        mock: true,
        key: 'rzp_test_mock',
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        invoice: {
          id: invoice.id,
          description: invoice.description
        }
      }, { status: 200 })
    }

    // 5. Connect to Razorpay API to generate order
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `invoice_${invoice.id}`,
        notes: {
          invoice_id: invoice.id,
          client_id: user.id
        }
      })
    })

    const orderData = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: orderData.error?.description || 'Razorpay order creation failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mock: false,
      key: keyId,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      invoice: {
        id: invoice.id,
        description: invoice.description
      }
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
