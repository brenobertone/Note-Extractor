'use client';

import { useState } from 'react';
import type { UserAction } from '@/types';

interface ImageModalProps {
  action: UserAction | null;
  onClose: () => void;
}

export default function ImageModal({ action, onClose }: ImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!action) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image Gallery */}
        <div className="w-1/2 bg-zinc-100 dark:bg-zinc-800 flex flex-col">
          <div className="flex-1 relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={action.images[currentImageIndex].publicUrl}
              alt="Note"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Image navigation if multiple images */}
          {action.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {action.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 ${
                    idx === currentImageIndex
                      ? 'border-indigo-500'
                      : 'border-transparent'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.publicUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Extracted Text */}
        <div className="w-1/2 p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm font-semibold">
                {action.category}
              </span>
              <p className="text-xs text-zinc-500 mt-2">
                {new Date(action.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="prose dark:prose-invert">
            <h3 className="text-lg font-semibold mb-2">Extracted Content</h3>
            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {action.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
