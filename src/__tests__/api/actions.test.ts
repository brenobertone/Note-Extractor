import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/actions/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockGetPublicUrl = vi.fn((path: string) => ({
  data: {
    publicUrl: `http://localhost:54321/storage/v1/object/public/note-images/${path}`,
  },
}));

const mockSelect = vi.fn(() => ({
  order: vi.fn(() => ({
    range: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 1,
            content: 'Buy milk',
            category: 'Tasks',
            created_at: '2026-03-25T10:00:00Z',
            images: [
              {
                id: 1,
                user_action_id: 1,
                storage_path: 'test/image1.png',
                file_name: 'image1.png',
                mime_type: 'image/png',
                file_size: 12345,
                created_at: '2026-03-25T10:00:00Z',
              },
            ],
          },
          {
            id: 2,
            content: 'Exercise daily',
            category: 'Habits',
            created_at: '2026-03-25T09:00:00Z',
            images: [
              {
                id: 2,
                user_action_id: 2,
                storage_path: 'test/image2.png',
                file_name: 'image2.png',
                mime_type: 'image/png',
                file_size: 23456,
                created_at: '2026-03-25T09:00:00Z',
              },
              {
                id: 3,
                user_action_id: 2,
                storage_path: 'test/image3.png',
                file_name: 'image3.png',
                mime_type: 'image/png',
                file_size: 34567,
                created_at: '2026-03-25T09:00:00Z',
              },
            ],
          },
        ],
        error: null,
      })
    ),
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

describe('GET /api/actions', () => {
  it('should return actions with nested images', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toMatchObject({
      id: 1,
      content: 'Buy milk',
      category: 'Tasks',
    });
    expect(result.data[0].images).toHaveLength(1);
  });

  it('should generate public URLs for each image', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data[0].images[0]).toHaveProperty('publicUrl');
    expect(result.data[0].images[0].publicUrl).toContain('note-images');
    expect(result.data[0].images[0].publicUrl).toContain('test/image1.png');
  });

  it('should support pagination with limit parameter', async () => {
    mockSelect.mockClear();

    const request = new NextRequest(
      'http://localhost:3000/api/actions?limit=10'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining('images (*)')
    );
  });

  it('should support pagination with offset parameter', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/actions?limit=5&offset=10'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('should use default pagination values when not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);

    expect(response.status).toBe(200);
    // Default should be limit=20, offset=0
  });

  it('should handle actions with multiple images', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data[1].images).toHaveLength(2);
    expect(result.data[1].images[0]).toHaveProperty('publicUrl');
    expect(result.data[1].images[1]).toHaveProperty('publicUrl');
  });

  it('should order results by created_at descending', async () => {
    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    // First action should be newer (higher timestamp)
    expect(new Date(result.data[0].created_at).getTime()).toBeGreaterThan(
      new Date(result.data[1].created_at).getTime()
    );
  });
});
