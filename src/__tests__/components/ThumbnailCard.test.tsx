import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThumbnailCard from '@/components/ThumbnailCard';
import type { UserAction } from '@/types';

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('ThumbnailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockActionSingleImage: UserAction = {
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
        publicUrl: 'http://localhost/test/image1.png',
      },
    ],
  };

  const mockActionMultipleImages: UserAction = {
    id: 2,
    content: 'Exercise daily',
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

  it('should render image with correct src', () => {
    render(<ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={() => {}} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'http://localhost/test/image1.png');
  });

  it('should show multi-image badge when images.length > 1', () => {
    render(
      <ThumbnailCard action={mockActionMultipleImages} onClick={() => {}} onDelete={() => {}} />
    );

    const badge = screen.getByText('+1');
    expect(badge).toBeInTheDocument();
  });

  it('should not show badge when only one image', () => {
    render(<ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={() => {}} />);

    const badge = screen.queryByText('+');
    expect(badge).not.toBeInTheDocument();
  });

  it('should display category label', () => {
    render(<ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={() => {}} />);

    const categoryLabel = screen.getByText('Tasks');
    expect(categoryLabel).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const mockOnClick = vi.fn();
    render(
      <ThumbnailCard action={mockActionSingleImage} onClick={mockOnClick} onDelete={() => {}} />
    );

    const card = screen.getByRole('img').parentElement;
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should have hover effects via CSS classes', () => {
    const { container } = render(
      <ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={() => {}} />
    );

    const card = container.firstChild;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('hover:border-indigo-500');
  });

  it('should show delete button', () => {
    render(
      <ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={() => {}} />
    );

    const deleteButton = screen.getByLabelText('Delete note');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked and confirmed', () => {
    const mockOnDelete = vi.fn();
    mockConfirm.mockReturnValue(true);

    render(
      <ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByLabelText('Delete note');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this note?'
    );
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should not call onDelete when user cancels confirmation', () => {
    const mockOnDelete = vi.fn();
    mockConfirm.mockReturnValue(false);

    render(
      <ThumbnailCard action={mockActionSingleImage} onClick={() => {}} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByLabelText('Delete note');
    fireEvent.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('should not trigger onClick when delete button is clicked', () => {
    const mockOnClick = vi.fn();
    const mockOnDelete = vi.fn();
    mockConfirm.mockReturnValue(true);

    render(
      <ThumbnailCard action={mockActionSingleImage} onClick={mockOnClick} onDelete={mockOnDelete} />
    );

    const deleteButton = screen.getByLabelText('Delete note');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
