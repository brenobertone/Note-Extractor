import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actionId = parseInt(id);

    if (isNaN(actionId)) {
      return NextResponse.json({ error: 'Invalid action ID' }, { status: 400 });
    }

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
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
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
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Action deleted successfully' });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
