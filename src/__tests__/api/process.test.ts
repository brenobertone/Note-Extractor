import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/process/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockStorageUpload = vi.fn(() =>
  Promise.resolve({ data: { path: 'test-path.png' }, error: null })
);
const mockStorageGetPublicUrl = vi.fn((path: string) => ({
  data: {
    publicUrl: `http://localhost:54321/storage/v1/object/public/note-images/${path}`,
  },
}));
const mockImagesInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() =>
      Promise.resolve({
        data: { id: 1, storage_path: 'test-path.png' },
        error: null,
      })
    ),
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'images') {
        return {
          insert: mockImagesInsert,
        };
      }
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: { id: 1 }, error: null })
            ),
          })),
        })),
      };
    }),
    storage: {
      from: vi.fn(() => ({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      })),
    },
  })),
}));

// Mock AI SDK
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>();
  return {
    ...actual,
    generateText: vi.fn().mockImplementation(async ({ messages }) => {
      // Count how many images are in the request
      const imageCount = messages[0].content.filter(
        (item: { type: string }) => item.type === 'image'
      ).length;

      // Return different content based on number of images
      if (imageCount > 1) {
        return {
          text: JSON.stringify({
            content: 'Buy milk and exercise daily',
            category: 'Tasks',
          }),
        };
      }

      return {
        text: JSON.stringify({
          content: 'Buy milk',
          category: 'Tasks',
        }),
      };
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

  it('should process multiple images together and return unified content', async () => {
    const formData = new FormData();
    const file1 = new File(['mock content 1'], 'test1.png', {
      type: 'image/png',
    });
    const file2 = new File(['mock content 2'], 'test2.png', {
      type: 'image/png',
    });
    formData.append('files', file1);
    formData.append('files', file2);

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
          content: 'Buy milk and exercise daily',
          category: 'Tasks',
        }),
      })
    );
  });

  it('should upload images to storage after processing', async () => {
    mockStorageUpload.mockClear();
    mockImagesInsert.mockClear();

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
    expect(result.success).toBe(true);

    // Verify storage upload was called
    expect(mockStorageUpload).toHaveBeenCalledTimes(1);
    expect(mockStorageUpload).toHaveBeenCalledWith(
      expect.stringContaining('.png'),
      expect.any(File),
      expect.objectContaining({
        contentType: 'image/png',
      })
    );
  });

  it('should create image records in database after upload', async () => {
    mockStorageUpload.mockClear();
    mockImagesInsert.mockClear();

    const formData = new FormData();
    const file = new File(['mock content'], 'test-image.png', {
      type: 'image/png',
    });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify images table insert was called
    expect(mockImagesInsert).toHaveBeenCalledTimes(1);
    expect(mockImagesInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          user_action_id: 1,
          storage_path: 'test-path.png',
          file_name: 'test-image.png',
          mime_type: 'image/png',
          file_size: expect.any(Number),
        }),
      ])
    );
  });

  it('should upload multiple images to storage for batch processing', async () => {
    mockStorageUpload.mockClear();
    mockImagesInsert.mockClear();

    const formData = new FormData();
    const file1 = new File(['content1'], 'image1.png', { type: 'image/png' });
    const file2 = new File(['content2'], 'image2.jpg', { type: 'image/jpeg' });
    formData.append('files', file1);
    formData.append('files', file2);

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify storage upload was called for each image
    expect(mockStorageUpload).toHaveBeenCalledTimes(2);

    // Verify images table insert was called for each image
    expect(mockImagesInsert).toHaveBeenCalledTimes(2);
  });
});
