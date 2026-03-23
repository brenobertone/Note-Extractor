import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadComponent from '@/components/UploadComponent';
import { expect, vi, it, describe } from 'vitest';

// Mock the global fetch
global.fetch = vi.fn();

describe('UploadComponent', () => {
  it('renders a file input', () => {
    render(<UploadComponent />);
    expect(screen.getByLabelText(/upload image/i)).toBeInTheDocument();
  });

  it('uploads a file to /api/process', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { content: 'Success', category: 'Tasks' },
      }),
    } as Response);

    render(<UploadComponent />);

    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload image/i) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/process',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
