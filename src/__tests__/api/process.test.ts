import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/process/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 1 }, error: null })
          ),
        })),
      })),
    })),
  })),
}));

// Mock AI SDK
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateText: vi.fn().mockResolvedValue({
      text: JSON.stringify({
        content: 'Buy milk',
        category: 'Tasks',
      }),
    }),
  };
});

describe('POST /api/process', () => {
  it('should process an image and persist correctly categorized data', async () => {
    const formData = new FormData();
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          content: 'Buy milk',
          category: 'Tasks',
        }),
      })
    );
  });
});
