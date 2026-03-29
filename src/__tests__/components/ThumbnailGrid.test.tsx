import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ThumbnailGrid from '@/components/ThumbnailGrid';

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('ThumbnailGrid', () => {
  const mockActions = [
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
          publicUrl: 'http://localhost/test/image1.png',
        },
      ],
    },
    {
      id: 2,
      content: 'Exercise',
      category: 'Habits' as const,
      created_at: '2026-03-25T09:00:00Z',
      images: [
        {
          id: 2,
          user_action_id: 2,
          storage_path: 'test/image2.png',
          file_name: 'image2.png',
          mime_type: 'image/png',
          file_size: 12345,
          created_at: '2026-03-25T09:00:00Z',
          publicUrl: 'http://localhost/test/image2.png',
        },
      ],
    },
  ];

  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockActions }),
      })
    ) as unknown as typeof fetch;
  });

  it('should fetch data from /api/actions on mount', async () => {
    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/actions?limit=20');
    });
  });

  it('should render grid with thumbnails', async () => {
    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('should have 4 column grid layout via CSS', async () => {
    const { container } = render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const grid = container.querySelector('.grid-cols-4');
      expect(grid).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    const loading = screen.getByText(/loading/i);
    expect(loading).toBeInTheDocument();
  });

  it('should show empty state when no actions exist', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    ) as unknown as typeof fetch;

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const emptyMessage = screen.getByText(/no notes/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const errorMessage = screen.getByText(/failed to load/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should be scrollable when overflow', async () => {
    const { container } = render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const scrollableContainer = container.querySelector('.overflow-y-auto');
      expect(scrollableContainer).toBeInTheDocument();
    });
  });

  it('should delete action when delete button is clicked', async () => {
    mockConfirm.mockReturnValue(true);

    // Setup initial fetch
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockActions }),
      })
      // Mock successful delete
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Action deleted successfully' }),
      });

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    // Click delete button on first item
    const deleteButtons = screen.getAllByLabelText('Delete note');
    fireEvent.click(deleteButtons[0]);

    // Verify delete API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/actions/1', {
        method: 'DELETE',
      });
    });

    // Verify item was removed from UI
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(1);
    });
  });

  it('should show error message if delete fails', async () => {
    mockConfirm.mockReturnValue(true);

    // Setup initial fetch
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockActions }),
      })
      // Mock failed delete
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Delete failed' }),
      });

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    // Click delete button
    const deleteButtons = screen.getAllByLabelText('Delete note');
    fireEvent.click(deleteButtons[0]);

    // Verify error message is shown
    await waitFor(() => {
      const errorMessage = screen.getByText(/failed to delete/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
