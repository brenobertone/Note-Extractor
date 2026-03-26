import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockDelete = vi.fn();
const mockRemove = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    storage: {
      from: vi.fn(() => ({
        remove: mockRemove,
      })),
    },
  })),
}));

// Import after mocking
const { DELETE } = await import('@/app/api/actions/[id]/route');

describe('DELETE /api/actions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete action with all images from storage and database', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_actions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 1,
                  content: 'Test action',
                  category: 'Tasks',
                  images: [
                    { storage_path: 'test-path-1.jpg' },
                    { storage_path: 'test-path-2.jpg' },
                  ],
                },
                error: null,
              })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({ data: null, error: null })),
          })),
        };
      }
      return { delete: mockDelete };
    });

    mockRemove.mockResolvedValue({ data: null, error: null });

    const request = new NextRequest('http://localhost:3000/api/actions/1');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Action deleted successfully');
    expect(mockRemove).toHaveBeenCalledWith([
      'test-path-1.jpg',
      'test-path-2.jpg',
    ]);
  });

  it('should return 404 if action not found', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Not found' },
          })),
        })),
      })),
    }));

    const request = new NextRequest('http://localhost:3000/api/actions/999');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '999' }),
    });

    expect(response.status).toBe(404);
  });

  it('should handle storage deletion errors gracefully', async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 1,
              images: [{ storage_path: 'test-path.jpg' }],
            },
            error: null,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
    }));

    mockRemove.mockResolvedValue({
      data: null,
      error: { message: 'Storage error' },
    });

    const request = new NextRequest('http://localhost:3000/api/actions/1');
    const response = await DELETE(request, {
      params: Promise.resolve({ id: '1' }),
    });

    expect(response.status).toBe(200); // Should still succeed
  });
});
