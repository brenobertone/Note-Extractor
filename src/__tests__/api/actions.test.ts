import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the service layer
vi.mock('@/lib/actions.service', () => ({
  getActions: vi.fn(),
}));

import { GET } from '@/app/api/actions/route';
import { getActions } from '@/lib/actions.service';

const mockGetActions = vi.mocked(getActions);

const mockActionsData = [
  {
    id: 1,
    content: 'Buy milk',
    category: 'Tasks' as const,
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
        publicUrl:
          'http://localhost:54321/storage/v1/object/public/note-images/test/image1.png',
      },
    ],
  },
  {
    id: 2,
    content: 'Exercise daily',
    category: 'Habits' as const,
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
        publicUrl:
          'http://localhost:54321/storage/v1/object/public/note-images/test/image2.png',
      },
      {
        id: 3,
        user_action_id: 2,
        storage_path: 'test/image3.png',
        file_name: 'image3.png',
        mime_type: 'image/png',
        file_size: 34567,
        created_at: '2026-03-25T09:00:00Z',
        publicUrl:
          'http://localhost:54321/storage/v1/object/public/note-images/test/image3.png',
      },
    ],
  },
];

describe('GET /api/actions', () => {
  it('should return actions with nested images', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

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
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data[0].images[0]).toHaveProperty('publicUrl');
    expect(result.data[0].images[0].publicUrl).toContain('note-images');
    expect(result.data[0].images[0].publicUrl).toContain('test/image1.png');
  });

  it('should support pagination with limit parameter', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest(
      'http://localhost:3000/api/actions?limit=10'
    );

    await GET(request);

    expect(mockGetActions).toHaveBeenCalledWith(10, 0);
  });

  it('should support pagination with offset parameter', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest(
      'http://localhost:3000/api/actions?limit=5&offset=10'
    );

    await GET(request);

    expect(mockGetActions).toHaveBeenCalledWith(5, 10);
  });

  it('should use default pagination values when not provided', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest('http://localhost:3000/api/actions');

    await GET(request);

    // Default should be limit=20, offset=0
    expect(mockGetActions).toHaveBeenCalledWith(20, 0);
  });

  it('should handle actions with multiple images', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.data[1].images).toHaveLength(2);
    expect(result.data[1].images[0]).toHaveProperty('publicUrl');
    expect(result.data[1].images[1]).toHaveProperty('publicUrl');
  });

  it('should order results by created_at descending', async () => {
    mockGetActions.mockResolvedValue(mockActionsData);

    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    // First action should be newer (higher timestamp)
    expect(new Date(result.data[0].created_at).getTime()).toBeGreaterThan(
      new Date(result.data[1].created_at).getTime()
    );
  });

  it('should return 500 when service throws', async () => {
    mockGetActions.mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost:3000/api/actions');

    const response = await GET(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('DB connection failed');
  });
});
