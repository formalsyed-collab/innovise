const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
    console.log('Fixing storage.objects RLS policy...');
    
    // We will drop the old policies and create new ones that don't rely on the get_user_role function which often fails across schemas.
    const sql = `
        drop policy if exists "Allow client and admin read access to private storage folder" on storage.objects;
        
        create policy "Allow client and admin read access to private storage folder"
        on storage.objects for select
        to authenticated
        using (
          bucket_id = 'documents' and 
          (
            (storage.foldername(name))[1] = auth.uid()::text or
            exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
          )
        );
        
        drop policy if exists "Allow client and admin upload access to private storage folder" on storage.objects;
        
        create policy "Allow client and admin upload access to private storage folder"
        on storage.objects for insert
        to authenticated
        with check (
          bucket_id = 'documents' and 
          (
            (storage.foldername(name))[1] = auth.uid()::text or
            exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
          )
        );
        
        drop policy if exists "Allow client and admin update access to private storage folder" on storage.objects;
        
        create policy "Allow client and admin update access to private storage folder"
        on storage.objects for update
        to authenticated
        using (
          bucket_id = 'documents' and 
          (
            (storage.foldername(name))[1] = auth.uid()::text or
            exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
          )
        );
        
        drop policy if exists "Allow admin delete access to private storage folder" on storage.objects;
        
        create policy "Allow admin delete access to private storage folder"
        on storage.objects for delete
        to authenticated
        using (
          bucket_id = 'documents' and 
          exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
        );
    `;

    // To run raw SQL from the JS client without an RPC, we actually can't directly.
    // Let me check if there's an RPC endpoint I can use, otherwise I can write this to a .sql file and instruct the user to run it.
}
