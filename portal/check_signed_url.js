const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseService = createClient(supabaseUrl, serviceKey);

async function main() {
    const storagePath = 'a1776514-6dc3-41b8-9aff-6b36ce85deab/82c54333-d76e-470e-bdc9-5209c443cfbd.jpg';
    const fileName = 'Screenshot_20260801_184920_Adobe Acrobat.jpg';
    
    console.log(`Trying to create signed URL using service_role key...`);
    const { data, error } = await supabaseService.storage
        .from('documents')
        .createSignedUrl(storagePath, 60, {
          download: fileName
        });
        
    if (error) {
        console.error('Service Key Error:', error.message);
    } else {
        console.log('Service Key Success:', data.signedUrl);
    }
}

main().catch(console.error);
