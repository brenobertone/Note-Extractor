import type { UserAction } from '@/types';

const API_BASE = '/api';

export interface ProcessResult {
  id: number;
  content: string;
  category: string;
}

export const apiClient = {
  async processImages(files: File[]): Promise<ProcessResult> {
    const formData = new FormData();

    if (files.length > 1) {
      files.forEach((file) => formData.append('files', file));
    } else {
      // Keep backward compatibility for single file
      formData.append('file', files[0]);
    }

    const response = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.data;
  },

  async getActions(limit: number = 20): Promise<UserAction[]> {
    const response = await fetch(`${API_BASE}/actions?limit=${limit}`);

    if (!response.ok) {
      throw new Error('Failed to fetch actions');
    }

    const { data } = await response.json();
    return data;
  },

  async deleteAction(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/actions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete action');
    }
  },
};
