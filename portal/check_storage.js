const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('--- Fetching from documents table ---');
    const { data: dbDocs, error: dbError } = await supabase.from('documents').select('id, file_name, storage_path');
    if (dbError) {
        console.error('DB Error:', dbError);
        return;
    }
    
    console.log(`Found ${dbDocs.length} document records in DB.`);
    
    console.log('\n--- Fetching from storage bucket ---');
    // For storage.list, we need to list by folder. The storage paths are typically client_id/file_name.
    // Let's just list the root folders and then their contents.
    const { data: rootFolders, error: storageError } = await supabase.storage.from('documents').list();
    
    if (storageError) {
        console.error('Storage Error:', storageError);
        return;
    }
    
    let storageFiles = [];
    if (rootFolders) {
        for (const folder of rootFolders) {
            // Check if it's a folder (no metadata)
            if (!folder.metadata) {
                const { data: files } = await supabase.storage.from('documents').list(folder.name);
                if (files) {
                    files.forEach(f => {
                        if (f.metadata) {
                            storageFiles.push(`${folder.name}/${f.name}`);
                        }
                    });
                }
            } else {
                storageFiles.push(folder.name);
            }
        }
    }
    
    console.log(`Found ${storageFiles.length} files in Storage.`);
    
    console.log('\n--- Comparing DB vs Storage ---');
    for (const doc of dbDocs) {
        const existsInStorage = storageFiles.includes(doc.storage_path);
        console.log(`DB Doc: ${doc.storage_path} | Exists in Storage? ${existsInStorage ? 'YES' : 'NO'}`);
    }
}

main().catch(console.error);
