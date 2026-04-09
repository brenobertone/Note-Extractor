import { NextRequest, NextResponse } from 'next/server';
import { deleteAction } from '@/lib/actions.service';

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

    await deleteAction(actionId);

    return NextResponse.json({ message: 'Action deleted successfully' });
  } catch (error: unknown) {
    console.error('API Error:', error);

    // Preserve 404 status from service layer
    const status = (error as Error & { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ error: message }, { status });
  }
}
