import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the service layer
const mockDeleteAction = vi.fn();
vi.mock('@/lib/actions.service', () => ({
  deleteAction: (...args: unknown[]) => mockDeleteAction(...args),
}));

// Import after mocking
const { DELETE } = await import('@/app/api/actions/[id]/route');

describe('DELETE /api/actions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete action with all images from storage and database', async () => {
    mockDeleteAction.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/actions/1');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Action deleted successfully');
    expect(mockDeleteAction).toHaveBeenCalledWith(1);
  });

  it('should return 404 if action not found', async () => {
    const error = new Error('Action not found');
    (error as Error & { status: number }).status = 404;
    mockDeleteAction.mockRejectedValue(error);

    const request = new NextRequest('http://localhost:3000/api/actions/999');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '999' }),
    });

    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid action ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions/abc');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'abc' }),
    });

    expect(response.status).toBe(400);
    expect(mockDeleteAction).not.toHaveBeenCalled();
  });

  it('should return 500 when service throws generic error', async () => {
    mockDeleteAction.mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/actions/1');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});
