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
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64 for LLM
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Call LLM
    const { text: llmResponse } = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the main text from this image and categorize it as either "Tasks" or "Habits". Respond with only a JSON object like {"content": "text here", "category": "Tasks"}.',
            },
            {
              type: 'image',
              image: base64Image,
            },
          ],
        },
      ],
    });

    let processedData;
    try {
      processedData = JSON.parse(llmResponse);
    } catch (e) {
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
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
