import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization (using env vars)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Support both single file and multiple files
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToProcess =
      files.length > 0 ? files : singleFile ? [singleFile] : [];

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert all files to base64 for LLM
    const base64Images = await Promise.all(
      filesToProcess.map(async (file) => {
        const bytes = await file.arrayBuffer();
        return Buffer.from(bytes).toString('base64');
      })
    );

    // Build content array with text prompt and all images
    const content = [
      {
        type: 'text' as const,
        text:
          filesToProcess.length > 1
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
      // In a real app, we might handle this differently, but for TDD we'll return the error if it fails
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data?.id,
        content: processedData.content,
        category: processedData.category,
      },
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
