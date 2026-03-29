import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization (using env vars)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch actions with images
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    return NextResponse.json({ data: actionsWithUrls });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
