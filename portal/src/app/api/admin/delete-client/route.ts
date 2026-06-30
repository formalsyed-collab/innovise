import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller and check if they are an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privileges required' }, { status: 403 })
    }

    // 2. Parse request payload
    const body = await request.json()
    const { clientId } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    // 3. Initialize admin client with SERVICE_ROLE_KEY to perform deletion
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured on server' }, { status: 500 })
    }

    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 4. Purge client files from Storage bucket 'documents'
    const { data: filesList, error: listError } = await adminSupabase.storage
      .from('documents')
      .list(clientId)

    if (listError) {
      console.error('Warning: could not list files for deletion:', listError)
    } else if (filesList && filesList.length > 0) {
      const filesToRemove = filesList.map(f => `${clientId}/${f.name}`)
      const { error: removeError } = await adminSupabase.storage
        .from('documents')
        .remove(filesToRemove)
      
      if (removeError) {
        console.error('Warning: could not clear files from storage bucket:', removeError)
      }
    }

    // 5. Delete Auth user (foreign key cascade deletes profiles, services, documents, requests, and invoices)
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(clientId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
