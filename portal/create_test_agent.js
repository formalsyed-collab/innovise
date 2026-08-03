const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const email = 'agent.test@innovise.com';
  const password = 'Password123!';

  console.log(`Creating test agent user: ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Test Agent',
      role: 'agent'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists. Fetching user to ensure role is set to agent.');
        const { data: users, error: findError } = await supabase.auth.admin.listUsers();
        if (findError) {
           console.error("Could not fetch users:", findError);
           return;
        }
        const user = users.users.find(u => u.email === email);
        if (user) {
            console.log("Found user, updating profile role...");
            const { error: updateError } = await supabase.from('profiles').update({ role: 'agent' }).eq('id', user.id);
            if (updateError) {
                console.error("Failed to update profile:", updateError);
            } else {
                console.log("Profile updated successfully!");
            }
        }
    } else {
        console.error("Error creating user:", authError.message);
    }
    return;
  }

  console.log("Auth user created successfully! ID:", authData.user.id);
  
  // Wait for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("Updating profile role to 'agent'...");
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'agent' })
    .eq('id', authData.user.id);

  if (profileError) {
    console.error("Error updating profile role:", profileError.message);
  } else {
    console.log("Test agent account successfully configured!");
    console.log("-----------------------------------------");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
  }
}

main().catch(console.error);
