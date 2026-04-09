import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadComponent from '@/components/UploadComponent';
import { expect, vi, it, describe } from 'vitest';

// Mock the api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    processImages: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

const mockProcessImages = vi.mocked(apiClient.processImages);

describe('UploadComponent', () => {
  it('renders a file input', () => {
    render(<UploadComponent />);
    expect(screen.getByLabelText(/upload image/i)).toBeInTheDocument();
  });

  it('uploads a file via apiClient.processImages', async () => {
    mockProcessImages.mockResolvedValue({
      id: 1,
      content: 'Success',
      category: 'Tasks',
    });

    render(<UploadComponent />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockProcessImages).toHaveBeenCalledWith([file]);
    });
  });
});
