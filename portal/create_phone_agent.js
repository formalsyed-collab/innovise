const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const phone = '+12345678901';
  const password = 'Password123!';

  console.log(`Creating test agent user with phone: ${phone}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
    user_metadata: {
      full_name: 'Phone Agent',
      role: 'agent'
    }
  });

  if (authError) {
    console.error("Error creating user:", authError.message);
    return;
  }

  console.log("Auth user created successfully! ID:", authData.user.id);
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("Updating profile role to 'agent'...");
  await supabase.from('profiles').update({ role: 'agent' }).eq('id', authData.user.id);
  console.log("Done.");
}

main().catch(console.error);
