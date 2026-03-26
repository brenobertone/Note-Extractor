'use client';

import type { UserAction } from '@/types';

interface ThumbnailCardProps {
  action: UserAction;
  onClick: () => void;
  onDelete: (id: number) => void;
}

export default function ThumbnailCard({ action, onClick, onDelete }: ThumbnailCardProps) {
  const thumbnailImage = action.images[0];

  if (!thumbnailImage || !thumbnailImage.publicUrl) {
    return null;
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      onDelete(action.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer group relative aspect-square rounded-lg overflow-hidden border-2 border-zinc-200 hover:border-indigo-500 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailImage.publicUrl}
        alt={`Note from ${new Date(action.created_at).toLocaleDateString()}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
      {action.images.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
          +{action.images.length - 1}
        </div>
      )}
      <button
        onClick={handleDelete}
        className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete note"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <span className="text-white text-xs font-semibold">
          {action.category}
        </span>
      </div>
    </div>
  );
}
