'use client';

import { useState } from 'react';
import UploadComponent from '@/components/UploadComponent';
import ThumbnailGrid from '@/components/ThumbnailGrid';
import ImageModal from '@/components/ImageModal';
import type { UserAction } from '@/types';

export default function Home() {
  const [selectedAction, setSelectedAction] = useState<UserAction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            SnapFlow
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Intelligently extract and categorize text from images.
          </p>
        </header>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-200 text-center">
              Process Image
            </h2>
            <UploadComponent onSuccess={handleUploadSuccess} />
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-200">
              Previous Notes
            </h2>
            <ThumbnailGrid
              key={refreshKey}
              onThumbnailClick={setSelectedAction}
            />
          </div>
        </section>

        <footer className="text-center text-zinc-400 dark:text-zinc-600 text-sm">
          Built with Next.js, OpenAI, and Supabase.
        </footer>
      </div>

      <ImageModal
        action={selectedAction}
        onClose={() => setSelectedAction(null)}
      />
    </main>
  );
}
