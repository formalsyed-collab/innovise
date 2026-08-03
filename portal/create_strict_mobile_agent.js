const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

const normalizePhone = (phone) => phone.replace(/[^\d+]/g, '');

async function main() {
  const phoneInput = '+919876543211';
  const password = 'Password123!';
  
  const normalized = normalizePhone(phoneInput);
  const authEmail = `phone_${normalized}@innovise.local`;

  console.log(`Creating strictly mobile agent test account for phone: ${phoneInput}...`);
  console.log(`(Underlying virtual email: ${authEmail})`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: authEmail,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Strict Mobile Agent',
      phone: phoneInput,
      role: 'agent'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists, skipping creation.');
    } else {
        console.error("Error creating user:", authError.message);
        return;
    }
  } else {
    console.log("Auth user created successfully! ID:", authData.user.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Updating profile role to 'agent'...");
    await supabase.from('profiles').update({ role: 'agent', phone: phoneInput }).eq('id', authData.user.id);
  }

  console.log("Done! Agent is ready to login with strictly phone.");
}

main().catch(console.error);
