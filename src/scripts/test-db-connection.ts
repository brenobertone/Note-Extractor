import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to local Supabase...');

  const testData = {
    content: 'Test content from integration script',
    category: 'Tasks',
  };

  const { data, error } = await supabase
    .from('user_actions')
    .insert([testData])
    .select()
    .single();

  if (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Successfully saved to local Supabase:', data);

  // Cleanup
  await supabase.from('user_actions').delete().eq('id', data.id);
  console.log('🧹 Cleanup successful.');
}

testConnection().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
