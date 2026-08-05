const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    const { data: dbDocs, error: dbError } = await supabase
        .from('documents')
        .select('id, file_name, storage_path')
        .ilike('file_name', '%Screenshot%');
        
    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }
    
    console.log(`Found ${dbDocs.length} matching document records in DB.`);
    
    for (const doc of dbDocs) {
        console.log(`Checking storage for: ${doc.storage_path}`);
        
        // Split path to folder and filename
        const parts = doc.storage_path.split('/');
        const folder = parts[0];
        const filename = parts.slice(1).join('/');
        
        const { data: files } = await supabase.storage.from('documents').list(folder);
        const exists = files && files.some(f => f.name === filename);
        
        console.log(`- DB Doc: ${doc.file_name} | Exists in Storage? ${exists ? 'YES' : 'NO'}`);
    }
}

main().catch(console.error);
