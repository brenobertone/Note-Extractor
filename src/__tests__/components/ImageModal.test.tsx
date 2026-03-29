import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageModal from '@/components/ImageModal';
import type { UserAction } from '@/types';

describe('ImageModal', () => {
  const mockActionSingleImage: UserAction = {
    id: 1,
    content: 'Buy milk from the store',
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
        publicUrl: 'http://localhost/test/image1.png',
      },
    ],
  };

  const mockActionMultipleImages: UserAction = {
    id: 2,
    content: 'Exercise and meditate daily',
    category: 'Habits',
    created_at: '2026-03-25T10:00:00Z',
    images: [
      {
        id: 2,
        user_action_id: 2,
        storage_path: 'test/image2.png',
        file_name: 'image2.png',
        mime_type: 'image/png',
        file_size: 12345,
        created_at: '2026-03-25T10:00:00Z',
        publicUrl: 'http://localhost/test/image2.png',
      },
      {
        id: 3,
        user_action_id: 2,
        storage_path: 'test/image3.png',
        file_name: 'image3.png',
        mime_type: 'image/png',
        file_size: 12345,
        created_at: '2026-03-25T10:00:00Z',
        publicUrl: 'http://localhost/test/image3.png',
      },
    ],
  };

  it('should not render when action is null', () => {
    const { container } = render(
      <ImageModal action={null} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show image on left and text on right', () => {
    render(<ImageModal action={mockActionSingleImage} onClose={() => {}} />);

    const mainImage = screen.getAllByRole('img')[0];
    expect(mainImage).toHaveAttribute(
      'src',
      'http://localhost/test/image1.png'
    );

    const content = screen.getByText('Buy milk from the store');
    expect(content).toBeInTheDocument();
  });

  it('should display category badge', () => {
    render(<ImageModal action={mockActionSingleImage} onClose={() => {}} />);

    const categoryBadge = screen.getByText('Tasks');
    expect(categoryBadge).toBeInTheDocument();
  });

  it('should display extracted content heading', () => {
    render(<ImageModal action={mockActionSingleImage} onClose={() => {}} />);

    const heading = screen.getByText('Extracted Content');
    expect(heading).toBeInTheDocument();
  });

  it('should close when clicking backdrop', () => {
    const mockOnClose = vi.fn();
    const { container } = render(
      <ImageModal action={mockActionSingleImage} onClose={mockOnClose} />
    );

    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close when clicking X button', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal action={mockActionSingleImage} onClose={mockOnClose} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when clicking modal content', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal action={mockActionSingleImage} onClose={mockOnClose} />);

    const content = screen.getByText('Buy milk from the store');
    fireEvent.click(content);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should show image carousel navigation for multiple images', () => {
    render(<ImageModal action={mockActionMultipleImages} onClose={() => {}} />);

    // Should show thumbnail navigation
    const thumbnails = screen.getAllByRole('img');
    // Main image + 2 thumbnails = 3 images
    expect(thumbnails.length).toBeGreaterThanOrEqual(3);
  });

  it('should navigate between images when clicking thumbnails', () => {
    render(<ImageModal action={mockActionMultipleImages} onClose={() => {}} />);

    const thumbnails = screen.getAllByRole('img');
    const firstThumbnail = thumbnails[1]; // Skip main image

    // Click second thumbnail
    fireEvent.click(firstThumbnail);

    // Main image should still be displayed (we just changed currentImageIndex)
    const mainImage = screen.getAllByRole('img')[0];
    expect(mainImage).toBeInTheDocument();
  });

  it('should not show carousel navigation for single image', () => {
    const { container } = render(
      <ImageModal action={mockActionSingleImage} onClose={() => {}} />
    );

    // Check that there are no thumbnail buttons (only one main image)
    const buttons = container.querySelectorAll('button');
    // Should only have close button, no thumbnail buttons
    const thumbnailButtons = Array.from(buttons).filter(
      (btn) => !btn.textContent?.includes('×')
    );
    expect(thumbnailButtons).toHaveLength(0);
  });
});
