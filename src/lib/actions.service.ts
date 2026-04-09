import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { supabase } from './supabase';
import type { UserAction } from '@/types';

// ── Process Images ──────────────────────────────────────────────────────────

export interface ProcessResult {
  id: number;
  content: string;
  category: string;
}

export async function processImages(files: File[]): Promise<ProcessResult> {
  // Convert all files to base64 for LLM
  const base64Images = await Promise.all(
    files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      return Buffer.from(bytes).toString('base64');
    })
  );

  // Build content array with text prompt and all images
  const content = [
    {
      type: 'text' as const,
      text:
        files.length > 1
          ? 'You will receive multiple images. Extract and combine the main text from all images, understanding them as a related package. Categorize the combined content as either "Tasks" or "Habits". Respond with only a JSON object like {"content": "combined text here", "category": "Tasks"}.'
          : 'Extract the main text from this image and categorize it as either "Tasks" or "Habits". Respond with only a JSON object like {"content": "text here", "category": "Tasks"}.',
    },
    ...base64Images.map((image) => ({
      type: 'image' as const,
      image,
    })),
  ];

  // Call LLM
  const { text: llmResponse } = await generateText({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  });

  let processedData;
  try {
    processedData = JSON.parse(llmResponse);
  } catch {
    // Fallback if LLM doesn't return valid JSON
    processedData = { content: llmResponse, category: 'Tasks' };
  }

  // Persist to Supabase
  const { data, error } = await supabase
    .from('user_actions')
    .insert([
      {
        content: processedData.content,
        category: processedData.category,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }

  // Upload images to storage and create image records
  try {
    await Promise.all(
      files.map(async (file, index) => {
        // Generate unique filename
        const fileExtension = file.type.split('/')[1] || 'png';
        const fileName = `${data.id}_${index}_${Date.now()}.${fileExtension}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('note-images')
          .upload(fileName, file, {
            contentType: file.type,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Insert image record
        const { error: imageError } = await supabase
          .from('images')
          .insert([
            {
              user_action_id: data.id,
              storage_path: uploadData.path,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
            },
          ])
          .select()
          .single();

        if (imageError) {
          console.error('Image record insert error:', imageError);
          throw imageError;
        }
      })
    );
  } catch (storageError) {
    console.error('Failed to store images:', storageError);
    // Note: user_action is already created, but images failed
    // In production, you might want to handle this differently
  }

  return {
    id: data.id,
    content: processedData.content,
    category: processedData.category,
  };
}

// ── Get Actions ─────────────────────────────────────────────────────────────

export async function getActions(
  limit: number = 20,
  offset: number = 0
): Promise<UserAction[]> {
  const { data, error } = await supabase
    .from('user_actions')
    .select(
      `
      *,
      images (*)
    `
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }

  // Generate public URLs for each image
  const actionsWithUrls = data.map((action) => ({
    ...action,
    images: action.images.map(
      (img: {
        id: number;
        user_action_id: number;
        storage_path: string;
        file_name: string;
        mime_type: string;
        file_size: number;
        created_at: string;
      }) => ({
        ...img,
        publicUrl: supabase.storage
          .from('note-images')
          .getPublicUrl(img.storage_path).data.publicUrl,
      })
    ),
  }));

  return actionsWithUrls;
}

// ── Delete Action ───────────────────────────────────────────────────────────

export async function deleteAction(actionId: number): Promise<void> {
  // First, fetch the action with its images to get storage paths
  const { data: action, error: fetchError } = await supabase
    .from('user_actions')
    .select(
      `
      *,
      images (storage_path)
    `
    )
    .eq('id', actionId)
    .single();

  if (fetchError || !action) {
    const err = new Error('Action not found');
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  // Delete images from storage
  if (action.images && action.images.length > 0) {
    const storagePaths = action.images.map(
      (img: { storage_path: string }) => img.storage_path
    );

    const { error: storageError } = await supabase.storage
      .from('note-images')
      .remove(storagePaths);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue even if storage deletion fails
    }
  }

  // Delete the action (cascade will handle images table)
  const { error: deleteError } = await supabase
    .from('user_actions')
    .delete()
    .eq('id', actionId);

  if (deleteError) {
    console.error('Database deletion error:', deleteError);
    throw new Error(deleteError.message);
  }
}
