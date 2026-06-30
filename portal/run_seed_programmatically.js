const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const clientId = '22222222-2222-2222-2222-222222222222';
  
  // 1. Create client auth user
  console.log("Checking / creating auth user...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }
  
  const existingClient = users.find(u => u.id === clientId || u.email === 'client@innovise.in');
  if (!existingClient) {
    console.log("Client auth user not found. Creating user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      id: clientId,
      email: 'client@innovise.in',
      phone: '+919876543210',
      password: 'password123',
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: 'Acme Corporate Solutions',
        phone: '+919876543210',
        address: '12, Industrial Area, Kanpur, UP',
        role: 'client'
      }
    });
    if (createError) {
      console.error("Error creating user:", createError);
    } else {
      console.log("Created user successfully:", newUser.user.id);
    }
  } else {
    console.log("Client auth user already exists. ID:", existingClient.id);
    // Make sure it is confirmed
    if (!existingClient.email_confirmed_at) {
      console.log("Confirming user...");
      await supabase.auth.admin.updateUserById(existingClient.id, { email_confirm: true, phone_confirm: true });
    }
  }

  // 2. Ensure profile exists
  console.log("Upserting profile...");
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: clientId,
    email: 'client@innovise.in',
    phone: '+919876543210',
    full_name: 'Acme Corporate Solutions',
    address: '12, Industrial Area, Kanpur, UP',
    role: 'client'
  });
  if (profileError) {
    console.error("Error upserting profile:", profileError);
  } else {
    console.log("Profile upserted successfully.");
  }

  // 3. Upsert Services
  console.log("Upserting services...");
  const services = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      client_id: clientId,
      service_name: 'Pvt Ltd Company Registration',
      status: 'in_progress',
      start_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      expected_completion: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      notes: 'Incorporation paperwork has been submitted to ROC. Waiting for approval.'
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      client_id: clientId,
      service_name: 'GST Registration & Onboarding',
      status: 'docs_pending',
      start_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      expected_completion: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
      notes: 'Filing cannot proceed. Please upload your office electricity utility bill as address proof.'
    }
  ];

  for (const s of services) {
    const { error: sErr } = await supabase.from('services').upsert(s);
    if (sErr) console.error(`Error upserting service ${s.id}:`, sErr);
  }
  console.log("Services done.");

  // 4. Upsert Invoices
  console.log("Upserting invoices...");
  const invoices = [
    {
      id: '55555555-5555-5555-5555-555555555555',
      client_id: clientId,
      service_id: '33333333-3333-3333-3333-333333333333',
      description: 'Pvt Ltd Registration Service Fee & ROC stamp duty charges',
      professional_fees: 6000.00,
      government_fees: 3500.00,
      total: 9500.00,
      status: 'pending',
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      paid_date: null
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      client_id: clientId,
      service_id: '44444444-4444-4444-4444-444444444444',
      description: 'GST Registration Consultation Charges',
      professional_fees: 2500.00,
      government_fees: 0.00,
      total: 2500.00,
      status: 'paid',
      due_date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      paid_date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ];

  for (const i of invoices) {
    const { error: iErr } = await supabase.from('invoices').upsert(i);
    if (iErr) console.error(`Error upserting invoice ${i.id}:`, iErr);
  }
  console.log("Invoices done.");

  // 5. Upsert Document Requests Checklist
  console.log("Upserting document requests...");
  const docRequests = [
    {
      id: '77777777-7777-7777-7777-777777777777',
      client_id: clientId,
      service_id: '33333333-3333-3333-3333-333333333333',
      title: 'Director PAN Card',
      description: 'Clear scan copy of PAN card for director',
      fulfilled: true
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      client_id: clientId,
      service_id: '44444444-4444-4444-4444-444444444444',
      title: 'Electricity Utility Address Proof',
      description: 'Electricity bill of the registered corporate office address, not older than 2 months',
      fulfilled: false
    }
  ];

  for (const dr of docRequests) {
    const { error: drErr } = await supabase.from('document_requests').upsert(dr);
    if (drErr) console.error(`Error upserting doc request ${dr.id}:`, drErr);
  }
  console.log("Doc requests done.");

  // 6. Upsert Documents
  console.log("Upserting documents...");
  const docs = [
    {
      id: '99999999-9999-9999-9999-999999999999',
      client_id: clientId,
      service_id: '33333333-3333-3333-3333-333333333333',
      file_name: 'pan_card_rahul.pdf',
      storage_path: '22222222-2222-2222-2222-222222222222/pan_card_rahul.pdf',
      doc_type: 'Director PAN Card',
      status: 'verified',
      uploaded_by: 'client'
    }
  ];

  for (const d of docs) {
    const { error: dErr } = await supabase.from('documents').upsert(d);
    if (dErr) console.error(`Error upserting document ${d.id}:`, dErr);
  }
  console.log("Documents done. Seeding program complete!");
}

main().catch(console.error);
