const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Testing login with phone +919506166560...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        phone: '+919506166560',
        password: 'password123'
    });
    
    if (signInError) {
        console.error('Sign in failed:', signInError.message);
    } else {
        console.log('Sign in SUCCESSFUL for phone! ID:', signInData.user.id);
    }
}

main().catch(console.error);
