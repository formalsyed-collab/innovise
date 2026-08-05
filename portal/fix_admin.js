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
  console.log("Searching for admin user by fetching all pages...");
  
  let page = 1;
  let adminUser = null;
  
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 100
    });
    
    if (error) {
      console.error(error);
      break;
    }
    
    if (users.length === 0) break;
    
    adminUser = users.find(u => u.email === 'officialtaxinn@gmail.com');
    if (adminUser) break;
    
    page++;
  }
  
  if (adminUser) {
    console.log("Found admin user ID:", adminUser.id);
    console.log("Updating password to 'password123'...");
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        full_name: 'Innovise Admin Staff',
        phone: '+919506166560'
      }
    });
    
    if (updateError) {
      console.error("Failed to update user:", updateError);
    } else {
      console.log("User updated successfully!");
    }
    
    // Upsert profile
    console.log("Upserting profile...");
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: adminUser.id,
      email: 'officialtaxinn@gmail.com',
      phone: '+919506166560',
      full_name: 'Innovise Admin Staff',
      role: 'admin'
    });
    
    if (profileError) {
      console.error("Failed to upsert profile:", profileError);
    } else {
      console.log("Profile upserted successfully!");
    }
  } else {
    console.log("Admin user still not found.");
  }
}

main().catch(console.error);
