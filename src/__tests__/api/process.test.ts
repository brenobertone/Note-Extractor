import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the service layer
vi.mock('@/lib/actions.service', () => ({
  processImages: vi.fn(),
}));

import { POST } from '@/app/api/process/route';
import { processImages } from '@/lib/actions.service';

const mockProcessImages = vi.mocked(processImages);

describe('POST /api/process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should process an image and persist correctly categorized data', async () => {
    mockProcessImages.mockResolvedValue({
      id: 1,
      content: 'Buy milk',
      category: 'Tasks',
    });

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
    mockProcessImages.mockResolvedValue({
      id: 1,
      content: 'Buy milk and exercise daily',
      category: 'Tasks',
    });

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

  it('should pass single file to service via files array', async () => {
    mockProcessImages.mockResolvedValue({
      id: 1,
      content: 'Buy milk',
      category: 'Tasks',
    });

    const formData = new FormData();
    const file = new File(['mock content'], 'test.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockProcessImages).toHaveBeenCalledTimes(1);
    expect(mockProcessImages).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(File)])
    );
  });

  it('should pass multiple files to service', async () => {
    mockProcessImages.mockResolvedValue({
      id: 1,
      content: 'Buy milk and exercise daily',
      category: 'Tasks',
    });

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
    expect(mockProcessImages).toHaveBeenCalledTimes(1);

    // Verify both files were passed to the service
    const calledWith = mockProcessImages.mock.calls[0][0];
    expect(calledWith).toHaveLength(2);
  });

  it('should return 400 when no file is uploaded', async () => {
    const formData = new FormData();

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 500 when service throws', async () => {
    mockProcessImages.mockRejectedValue(new Error('LLM failure'));

    const formData = new FormData();
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/process', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.error).toBe('LLM failure');
  });
});
