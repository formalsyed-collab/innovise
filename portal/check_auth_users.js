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
  console.log("Listing auth users...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  console.log(`Found ${users.length} users:`);
  for (const u of users) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Confirmed At: ${u.email_confirmed_at || u.phone_confirmed_at}`);
  }

  console.log("\nListing profiles from DB...");
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
  if (profileError) {
    console.error("Error listing profiles:", profileError);
  } else {
    console.log(`Found ${profiles.length} profiles:`);
    for (const p of profiles) {
      console.log(`- ID: ${p.id}, Email: ${p.email}, Phone: ${p.phone}, Name: ${p.full_name}, Role: ${p.role}`);
    }
  }
}

main().catch(console.error);
