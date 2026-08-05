const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjM3OTQsImV4cCI6MjA5Njg5OTc5NH0.AVYg5tHX0iv3C0M_my5GfnoN-Ozj7VeLYavvcK8cyQI';

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
    console.log('Testing login with ANON key...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'officialtaxinn@gmail.com',
        password: 'password123'
    });
    
    if (error) {
        console.error('Sign in failed:', error.message);
    } else {
        console.log('Sign in SUCCESSFUL using ANON key! ID:', data.user.id);
    }
}

main().catch(console.error);
