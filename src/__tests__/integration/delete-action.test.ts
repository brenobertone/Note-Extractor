import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Delete Action Integration', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let testActionId: number;

  beforeAll(async () => {
    // Create a test action
    const { data: action, error: actionError } = await supabase
      .from('user_actions')
      .insert({
        content: 'Test action for deletion',
        category: 'Tasks',
      })
      .select()
      .single();

    expect(actionError).toBeNull();
    expect(action).toBeDefined();
    testActionId = action.id;

    // Add test images
    const { error: imageError } = await supabase.from('images').insert([
      {
        user_action_id: testActionId,
        storage_path: 'test/delete-test-1.png',
        file_name: 'delete-test-1.png',
        mime_type: 'image/png',
        file_size: 1024,
      },
      {
        user_action_id: testActionId,
        storage_path: 'test/delete-test-2.png',
        file_name: 'delete-test-2.png',
        mime_type: 'image/png',
        file_size: 2048,
      },
    ]);

    expect(imageError).toBeNull();
  });

  it('should delete action and cascade delete images', async () => {
    // Delete the action
    const { error: deleteError } = await supabase
      .from('user_actions')
      .delete()
      .eq('id', testActionId);

    expect(deleteError).toBeNull();

    // Verify action is deleted
    const { data: action } = await supabase
      .from('user_actions')
      .select()
      .eq('id', testActionId)
      .single();

    expect(action).toBeNull();

    // Verify images are cascade deleted
    const { data: images } = await supabase
      .from('images')
      .select()
      .eq('user_action_id', testActionId);

    expect(images).toEqual([]);
  });

  it('should handle deleting non-existent action gracefully', async () => {
    const { error } = await supabase
      .from('user_actions')
      .delete()
      .eq('id', 99999);

    // No error should be thrown for non-existent ID
    expect(error).toBeNull();
  });
});
