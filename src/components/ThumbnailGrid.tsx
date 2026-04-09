'use client';

import ThumbnailCard from './ThumbnailCard';
import { useActions } from '@/hooks/useActions';
import type { UserAction } from '@/types';

interface ThumbnailGridProps {
  onThumbnailClick: (action: UserAction) => void;
  refreshKey?: number;
}

export default function ThumbnailGrid({
  onThumbnailClick,
  refreshKey = 0,
}: ThumbnailGridProps) {
  const { actions, loading, error, deleteAction } = useActions(refreshKey);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No notes yet. Upload an image to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <div className="grid grid-cols-4 gap-4">
        {actions
          .filter((action) => action.images && action.images.length > 0)
          .map((action) => (
            <ThumbnailCard
              key={action.id}
              action={action}
              onClick={() => onThumbnailClick(action)}
              onDelete={deleteAction}
            />
          ))}
      </div>
    </div>
  );
}
