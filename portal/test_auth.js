const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  const u = users.users.find(u => u.email === 'officialtaxinn@gmail.com' || u.phone === '919506166560' || u.phone === '+919506166560');
  if (u) {
    console.log('Found user:', u.id, u.email, u.phone);
  } else {
    console.log('User not found in list (might be paginated). Attempting to fetch by email...');
    
    // Attempt login to test if it works at all
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'officialtaxinn@gmail.com',
        password: 'password123'
    });
    
    if (signInError) {
        console.error('Sign in failed:', signInError.message);
    } else {
        console.log('Sign in SUCCESSFUL for officialtaxinn@gmail.com / password123. ID:', signInData.user.id);
    }
  }
}

main().catch(console.error);
