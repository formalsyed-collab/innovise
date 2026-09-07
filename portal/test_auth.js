const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
const supabaseUrl = env.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim();
const supabaseKey = env.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim();

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

supabaseAdmin.auth.admin.listUsers().then(({data, error}) => {
  if (error) console.error(error);
  else {
    const agents = data.users.filter(u => 
      u.email === 'officialtaxinn@gmail.com' || 
      u.phone === '8052566560' || 
      (u.user_metadata && (u.user_metadata.role === 'admin' || u.user_metadata.role === 'agent'))
    );
    console.log(agents.map(u => ({ email: u.email, phone: u.phone, metadata: u.user_metadata })));
  }
});
