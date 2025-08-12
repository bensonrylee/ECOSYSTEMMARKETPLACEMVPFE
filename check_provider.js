import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ftozjjjrhifbblpslixk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0b3pqampyaGlmYmJscHNsaXhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk3OTA2MCwiZXhwIjoyMDY5NTU1MDYwfQ.ScfFwC4rIqG1EVkyZd1FiW9cl7DWx040f_YiWi2ZlGw'
);

async function check() {
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '45ff8aff-d38d-485f-9a96-91c2a86f48fc')
    .single();
  
  console.log('Profile:', profile);
  if (profileError) console.log('Profile error:', profileError);
  
  // Try to insert provider directly
  const { data, error } = await supabase
    .from('providers')
    .insert({
      id: '45ff8aff-d38d-485f-9a96-91c2a86f48fc',
      stripe_connect_id: 'acct_1RvArcAbLWkD0WxT',
      charges_enabled: true
    })
    .select();
  
  console.log('Insert result:', data);
  if (error) {
    console.log('Insert error message:', error.message);
    console.log('Insert error code:', error.code);
    console.log('Full error:', error);
  }
}

check();