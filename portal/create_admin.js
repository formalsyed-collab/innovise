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
  console.log("Checking if admin user exists...");
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  const existingAdmin = users?.find(u => u.email === 'officialtaxinn@gmail.com');
  
  if (!existingAdmin) {
    console.log("Admin auth user not found. Creating user...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'officialtaxinn@gmail.com',
      phone: '+919506166560',
      password: 'password123',
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: 'Innovise Admin Staff',
        phone: '+919506166560',
        role: 'admin'
      }
    });
    
    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }
    
    console.log("Created admin user successfully:", newUser.user.id);
    
    // Upsert profile
    await new Promise(r => setTimeout(r, 1000));
    await supabase.from('profiles').upsert({
      id: newUser.user.id,
      email: 'officialtaxinn@gmail.com',
      phone: '+919506166560',
      full_name: 'Innovise Admin Staff',
      role: 'admin'
    });
    console.log("Admin profile upserted.");
  } else {
    console.log("Admin user already exists. Checking password and role...");
    // Update password just in case
    await supabase.auth.admin.updateUserById(existingAdmin.id, { password: 'password123', email_confirm: true });
    
    await supabase.from('profiles').upsert({
      id: existingAdmin.id,
      email: 'officialtaxinn@gmail.com',
      phone: '+919506166560',
      full_name: 'Innovise Admin Staff',
      role: 'admin'
    });
    console.log("Admin user updated successfully.");
  }
}

main().catch(console.error);
