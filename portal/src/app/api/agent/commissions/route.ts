import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Agent can only fetch their own commissions (or admin can fetch all? Let's just do agent for now)
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || user.id

    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
       return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only allow querying other agent's if the caller is an admin
    if (agentId !== user.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch commissions for this agent
    const { data: commissions, error: fetchError } = await supabase
      .from('commissions')
      .select(`
        *,
        client:profiles!commissions_client_id_fkey(id, full_name, email),
        invoice:invoices(id, description, status, professional_fees)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    // Calculate totals
    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalPending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + Number(c.amount), 0)
    const totalPaid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + Number(c.amount), 0)

    return NextResponse.json({
      success: true,
      commissions,
      stats: {
        totalEarned,
        totalPending,
        totalPaid
      }
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
