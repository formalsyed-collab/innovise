const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjM3OTQsImV4cCI6MjA5Njg5OTc5NH0.AVYg5tHX0iv3C0M_my5GfnoN-Ozj7VeLYavvcK8cyQI';

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  console.log("Attempting to login as admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'officialtaxinn@gmail.com',
    password: 'password123'
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }
  
  console.log("Login successful! User ID:", authData.user.id);
  
  // Now fetch the profile using the authenticated client
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .single();
    
  if (profileError) {
    console.error("Error fetching profile:", profileError);
  } else {
    console.log("Profile fetched:", profile);
    if (profile?.role !== 'agent' && profile?.role !== 'admin') {
      console.log("FAILED ROLE CHECK");
    } else {
      console.log("PASSED ROLE CHECK");
    }
  }
}

main().catch(console.error);
