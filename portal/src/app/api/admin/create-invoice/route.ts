import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller and check if they are an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 })
    }

    // 2. Parse request payload
    const body = await request.json()
    const { clientId, serviceId, description, professionalFees, governmentFees, dueDate } = body

    if (!clientId || !description || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prof = Number(professionalFees) || 0
    const gov = Number(governmentFees) || 0
    const totalVal = prof + gov

    // 3. Fetch client details to pass to Refrens
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('full_name, email, phone, address')
      .eq('id', clientId)
      .eq('role', 'client')
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 })
    }

    // 4. Initialize Refrens fields
    let refrensInvoiceId: string | null = null
    let refrensPdfUrl: string | null = null

    const refrensUrlKey = process.env.REFRENS_URL_KEY?.trim()
    const refrensAppId = process.env.REFRENS_APP_ID?.trim()
    const refrensAppSecret = process.env.REFRENS_APP_SECRET?.trim()

    // Only hit Refrens if App credentials are configured
    if (refrensUrlKey && refrensAppId && refrensAppSecret) {
      try {
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
          throw new Error(authData.message || 'Failed to retrieve access token from Refrens')
        }

        const accessToken = authData.accessToken

        // B. Construct line items
        const items = []
        if (prof > 0) {
          items.push({
            name: description || 'Professional Fees',
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
            name: description,
            quantity: 1,
            rate: 0
          })
        }

        const payload = {
          invoiceTitle: 'Tax Invoice',
          invoiceSubTitle: description,
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate,
          invoiceType: 'INVOICE',
          currency: 'INR',
          contact: {
            phone: '+91 78600 66560',
            email: 'admin@innovise.in'
          },
          billedTo: {
            name: client.full_name,
            address: client.address || '',
            country: 'IN'
          },
          items
        }

        // C. Create Invoice using the dynamically generated Access Token
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
          // Store Refrens attributes if successfully returned
          refrensInvoiceId = data._id || data.id || data.invoiceNumber || null
          refrensPdfUrl = data.share?.pdf || data.share?.link || data.pdfUrl || data.shortUrl || null
        } else {
          console.warn('Refrens API rejected invoice generation:', data)
        }
      } catch (refrensErr) {
        console.error('Error connecting to Refrens API:', refrensErr)
      }
    }

    // 5. Insert invoice in database
    const { data: newInvoice, error: dbError } = await supabase
      .from('invoices')
      .insert({
        client_id: clientId,
        service_id: serviceId || null,
        description,
        professional_fees: prof,
        government_fees: gov,
        total: totalVal,
        due_date: dueDate,
        status: 'pending',
        refrens_invoice_id: refrensInvoiceId,
        refrens_pdf_url: refrensPdfUrl
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, invoice: newInvoice }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
