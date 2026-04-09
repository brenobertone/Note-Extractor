import { NextRequest, NextResponse } from 'next/server';
import { processImages } from '@/lib/actions.service';

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

    const result = await processImages(filesToProcess);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
