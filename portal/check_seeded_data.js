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
  
  console.log("Checking services...");
  const { data: services, error: sErr } = await supabase.from('services').select('*').eq('client_id', clientId);
  console.log(`Services for ${clientId}:`, sErr || services.length);

  console.log("Checking invoices...");
  const { data: invoices, error: iErr } = await supabase.from('invoices').select('*').eq('client_id', clientId);
  console.log(`Invoices for ${clientId}:`, iErr || invoices.length);

  console.log("Checking documents...");
  const { data: documents, error: dErr } = await supabase.from('documents').select('*').eq('client_id', clientId);
  console.log(`Documents for ${clientId}:`, dErr || documents.length);
}

main().catch(console.error);
