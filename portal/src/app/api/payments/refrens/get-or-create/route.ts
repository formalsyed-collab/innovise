import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // 2. If it already has the Refrens URL, return it immediately
    if (invoice.refrens_pdf_url) {
      return NextResponse.json({ success: true, url: invoice.refrens_pdf_url }, { status: 200 })
    }

    // 3. Otherwise, generate it on-the-fly
    const refrensUrlKey = process.env.REFRENS_URL_KEY?.trim()
    const refrensAppId = process.env.REFRENS_APP_ID?.trim()
    const refrensAppSecret = process.env.REFRENS_APP_SECRET?.trim()

    if (!refrensUrlKey || !refrensAppId || !refrensAppSecret) {
      return NextResponse.json({ 
        error: 'Refrens API keys are not configured on the server. Falling back to local PDF.',
        fallback: true 
      }, { status: 400 })
    }

    // Fetch client details
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('full_name, email, phone, address')
      .eq('id', invoice.client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    // A. Dynamic Authentication to retrieve JWT Access Token
    const authResponse = await fetch('https://api.refrens.com/authentication', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: 'app-secret',
        appId: refrensAppId,
        appSecret: refrensAppSecret
      })
    })

    const authData = await authResponse.json()
    if (!authResponse.ok || !authData.accessToken) {
      return NextResponse.json({ 
        error: authData.message || 'Failed to authenticate with Refrens API.',
        fallback: true 
      }, { status: 400 })
    }

    const accessToken = authData.accessToken

    // B. Construct line items
    const prof = Number(invoice.professional_fees) || 0
    const gov = Number(invoice.government_fees) || 0
    const items = []
    
    if (prof > 0) {
      items.push({
        name: invoice.description || 'Professional Fees',
        quantity: 1,
        rate: prof
      })
    }
    if (gov > 0) {
      items.push({
        name: 'Government Fees',
        quantity: 1,
        rate: gov
      })
    }
    if (items.length === 0) {
      items.push({
        name: invoice.description || 'Service Invoice',
        quantity: 1,
        rate: 0
      })
    }

    const payload = {
      invoiceTitle: 'Tax Invoice',
      invoiceSubTitle: invoice.description,
      invoiceDate: new Date(invoice.created_at).toISOString().split('T')[0],
      dueDate: invoice.due_date,
      invoiceType: 'INVOICE',
      currency: 'INR',
      contact: {
        phone: client.phone || '',
        email: client.email || ''
      },
      billedTo: {
        name: client.full_name,
        address: client.address || '',
        country: 'IN'
      },
      items
    }

    // C. Create Invoice
    const response = await fetch(`https://api.refrens.com/businesses/${refrensUrlKey}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (response.ok && data) {
      const refrensInvoiceId = data._id || data.id || data.invoiceNumber || null
      const refrensPdfUrl = data.share?.pdf || data.share?.link || data.pdfUrl || data.shortUrl || null

      if (refrensPdfUrl) {
        // Save back to local DB
        await supabase
          .from('invoices')
          .update({
            refrens_invoice_id: refrensInvoiceId,
            refrens_pdf_url: refrensPdfUrl
          })
          .eq('id', invoiceId)

        return NextResponse.json({ success: true, url: refrensPdfUrl }, { status: 200 })
      }
    }

    return NextResponse.json({ 
      error: 'Failed to create invoice on Refrens platform.',
      fallback: true 
    }, { status: 400 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error', fallback: true }, { status: 500 })
  }
}
