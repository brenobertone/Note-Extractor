import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Storage Integration', () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

  const supabase = createClient(supabaseUrl, supabaseKey);

  let testActionId: number;
  const testImagePaths: string[] = [];

  beforeAll(async () => {
    // Create a test user_action record
    const { data, error } = await supabase
      .from('user_actions')
      .insert([
        {
          content: 'Test content for storage integration',
          category: 'Tasks',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create test action:', error);
      throw error;
    }

    testActionId = data.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test images from storage
    if (testImagePaths.length > 0) {
      await supabase.storage.from('note-images').remove(testImagePaths);
    }

    // Cleanup: Delete test action (cascades to images table)
    if (testActionId) {
      await supabase.from('user_actions').delete().eq('id', testActionId);
    }
  });

  it('can insert image records with foreign key relationship', async () => {
    const imageData = {
      user_action_id: testActionId,
      storage_path: 'test/image1.png',
      file_name: 'image1.png',
      mime_type: 'image/png',
      file_size: 12345,
    };

    // Insert image record
    const { data, error } = await supabase
      .from('images')
      .insert([imageData])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject(imageData);
    expect(data.id).toBeDefined();
    expect(data.created_at).toBeDefined();

    // Cleanup this specific test
    await supabase.from('images').delete().eq('id', data.id);
  });

  it('can query user_actions with nested images', async () => {
    // Insert multiple image records
    const imageData = [
      {
        user_action_id: testActionId,
        storage_path: 'test/image2.png',
        file_name: 'image2.png',
        mime_type: 'image/png',
        file_size: 10000,
      },
      {
        user_action_id: testActionId,
        storage_path: 'test/image3.png',
        file_name: 'image3.png',
        mime_type: 'image/png',
        file_size: 15000,
      },
    ];

    const { error: insertError } = await supabase
      .from('images')
      .insert(imageData);

    expect(insertError).toBeNull();

    // Query with relationship
    const { data, error } = await supabase
      .from('user_actions')
      .select(
        `
        *,
        images (*)
      `
      )
      .eq('id', testActionId)
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.images).toHaveLength(2);
    expect(data.images[0]).toHaveProperty('storage_path');
    expect(data.images[0]).toHaveProperty('file_name');

    // Cleanup
    await supabase.from('images').delete().eq('user_action_id', testActionId);
  });

  it('can upload and retrieve images from Supabase Storage', async () => {
    // Create a small test image (1x1 PNG)
    const base64Image =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Image, 'base64');

    const fileName = `test_${Date.now()}.png`;
    testImagePaths.push(fileName);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('note-images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
      });

    expect(uploadError).toBeNull();
    expect(uploadData).toBeDefined();
    expect(uploadData?.path).toBe(fileName);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('note-images').getPublicUrl(fileName);

    expect(publicUrl).toContain(fileName);
    expect(publicUrl).toContain('note-images');
  });

  it('enforces foreign key constraint on images table', async () => {
    const invalidImageData = {
      user_action_id: 999999, // Non-existent ID
      storage_path: 'test/invalid.png',
      file_name: 'invalid.png',
      mime_type: 'image/png',
      file_size: 1000,
    };

    // Should fail due to foreign key constraint
    const { error } = await supabase.from('images').insert([invalidImageData]);

    expect(error).not.toBeNull();
    expect(error?.message).toContain('foreign key');
  });

  it('cascades delete from user_actions to images', async () => {
    // Create a test action
    const { data: action, error: actionError } = await supabase
      .from('user_actions')
      .insert([
        {
          content: 'Test cascade delete',
          category: 'Habits',
        },
      ])
      .select()
      .single();

    expect(actionError).toBeNull();

    // Create an image linked to this action
    const { data: image, error: imageError } = await supabase
      .from('images')
      .insert([
        {
          user_action_id: action.id,
          storage_path: 'test/cascade.png',
          file_name: 'cascade.png',
          mime_type: 'image/png',
          file_size: 5000,
        },
      ])
      .select()
      .single();

    expect(imageError).toBeNull();

    // Delete the action
    const { error: deleteError } = await supabase
      .from('user_actions')
      .delete()
      .eq('id', action.id);

    expect(deleteError).toBeNull();

    // Verify image was also deleted (cascade)
    const { data: orphanedImage, error: queryError } = await supabase
      .from('images')
      .select()
      .eq('id', image.id)
      .single();

    expect(orphanedImage).toBeNull();
    expect(queryError).not.toBeNull();
  });
});
