'use client';

import { useState, useEffect } from 'react';
import ThumbnailCard from './ThumbnailCard';
import type { UserAction } from '@/types';

interface ThumbnailGridProps {
  onThumbnailClick: (action: UserAction) => void;
  refreshKey?: number;
}

export default function ThumbnailGrid({
  onThumbnailClick,
  refreshKey = 0,
}: ThumbnailGridProps) {
  const [actions, setActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, [refreshKey]);

  const fetchActions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/actions?limit=20');

      if (!response.ok) {
        throw new Error('Failed to fetch actions');
      }

      const { data } = await response.json();
      setActions(data);
    } catch (err) {
      console.error('Error fetching actions:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/actions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete action');
      }

      // Remove from local state
      setActions((prev) => prev.filter((action) => action.id !== id));
    } catch (err) {
      console.error('Error deleting action:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

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
              onDelete={handleDelete}
            />
          ))}
      </div>
    </div>
  );
}
