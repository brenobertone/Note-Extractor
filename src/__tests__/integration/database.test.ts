import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Database Integration', () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

  const supabase = createClient(supabaseUrl, supabaseKey);

  it('can insert and delete a record in the user_actions table', async () => {
    const testData = {
      content: 'CI Integration Test',
      category: 'Tasks',
    };

    // Insert
    const { data, error } = await supabase
      .from('user_actions')
      .insert([testData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
    }

    expect(error).toBeNull();
    expect(data).toMatchObject(testData);

    // Cleanup
    const { error: deleteError } = await supabase
      .from('user_actions')
      .delete()
      .eq('id', data.id);

    expect(deleteError).toBeNull();
  });
});
