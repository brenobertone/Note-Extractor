'use client';

import React, { useState } from 'react';

const UploadComponent = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setResult(result.data);
      setFile(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const [result, setResult] = useState<{
    content: string;
    category: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        onChange={handleFileChange}
        className="block w-full text-sm text-zinc-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-indigo-50 file:text-indigo-700
          hover:file:bg-indigo-100
          dark:file:bg-zinc-800 dark:file:text-zinc-400"
      />

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
        disabled={!file || isUploading}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors w-full sm:w-auto font-medium"
      >
        {isUploading ? 'Processing...' : 'Upload & Categorize'}
      </button>
    </div>
  );
};

export default UploadComponent;
