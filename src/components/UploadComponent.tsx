'use client';

import React, { useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface UploadComponentProps {
  onSuccess?: () => void;
}

const UploadComponent = ({ onSuccess }: UploadComponentProps = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    content: string;
    category: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const data = await apiClient.processImages(files);

      setResult(data);
      setFiles([]);

      // Trigger gallery refresh
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <label
        htmlFor="image-upload"
        className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300"
      >
        Upload Image
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm text-zinc-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
          dark:file:bg-zinc-800 dark:file:text-zinc-400"
      />

      {files.length > 0 && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {files.length} {files.length === 1 ? 'file' : 'files'} selected
        </p>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg border border-green-100 dark:border-green-800">
          <p className="font-bold text-sm mb-1">✨ Categorized!</p>
          <p className="text-sm">
            <strong>{result.category}:</strong> {result.content}
          </p>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors w-full sm:w-auto font-medium"
      >
        {isUploading ? 'Processing...' : 'Upload & Categorize'}
      </button>
    </div>
  );
};

export default UploadComponent;
