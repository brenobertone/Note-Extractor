import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ThumbnailGrid from '@/components/ThumbnailGrid';

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock the api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getActions: vi.fn(),
    deleteAction: vi.fn(),
  },
}));

import { apiClient } from '@/lib/api-client';

const mockGetActions = vi.mocked(apiClient.getActions);
const mockDeleteAction = vi.mocked(apiClient.deleteAction);

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
    vi.clearAllMocks();
    mockGetActions.mockResolvedValue(mockActions);
  });

  it('should fetch data from apiClient on mount', async () => {
    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      expect(mockGetActions).toHaveBeenCalledWith(20);
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
    mockGetActions.mockResolvedValue([]);

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    await waitFor(() => {
      const emptyMessage = screen.getByText(/no notes/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockGetActions.mockRejectedValue(new Error('Network error'));

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
    mockDeleteAction.mockResolvedValue(undefined);

    render(<ThumbnailGrid onThumbnailClick={() => {}} />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBe(2);
    });

    // Click delete button on first item
    const deleteButtons = screen.getAllByLabelText('Delete note');
    fireEvent.click(deleteButtons[0]);

    // Verify delete was called via apiClient
    await waitFor(() => {
      expect(mockDeleteAction).toHaveBeenCalledWith(1);
    });

    // Verify item was removed from UI
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(1);
    });
  });

  it('should show error message if delete fails', async () => {
    mockConfirm.mockReturnValue(true);
    mockDeleteAction.mockRejectedValue(new Error('Delete failed'));

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
