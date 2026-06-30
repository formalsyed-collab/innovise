const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jdhcqdvbsoqaczlwkjmr.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaGNxZHZic29xYWN6bHdram1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTMyMzc5NCwiZXhwIjoyMDk2ODk5Nzk0fQ.uZn83Mroe2eYzRw6JlW5li2iLLDWEP7ngvPO-cXCgFY';

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  console.log("Checking if 'queries' table exists...");
  const { data, error } = await supabase.from('queries').select('*').limit(1);
  if (error) {
    console.log("Table 'queries' check result: Error:", error.message);
  } else {
    console.log("Table 'queries' check result: SUCCESS! Data:", data);
  }

  console.log("Checking if 'messages' table exists...");
  const { data: mData, error: mError } = await supabase.from('messages').select('*').limit(1);
  if (mError) {
    console.log("Table 'messages' check result: Error:", mError.message);
  } else {
    console.log("Table 'messages' check result: SUCCESS! Data:", mData);
  }
}

main().catch(console.error);
