'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UserAction } from '@/types';

interface UseActionsReturn {
  actions: UserAction[];
  loading: boolean;
  error: string | null;
  deleteAction: (id: number) => Promise<void>;
}

export function useActions(refreshKey: number = 0): UseActionsReturn {
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
      const data = await apiClient.getActions(20);
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
      await apiClient.deleteAction(id);
      // Remove from local state
      setActions((prev) => prev.filter((action) => action.id !== id));
    } catch (err) {
      console.error('Error deleting action:', err);
      setError('Failed to delete note. Please try again.');
    }
  };

  return {
    actions,
    loading,
    error,
    deleteAction: handleDelete,
  };
}
