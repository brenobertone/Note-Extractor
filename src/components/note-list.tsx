"use client";

import type { Note } from "@/lib/types";
import NoteCard from "@/components/note-card";
import { useAtom } from "jotai";
import { notesAtom, isProcessingAtom } from "@/lib/store";
import { Skeleton } from "./ui/skeleton";

export default function NoteList() {
  const [notes] = useAtom(notesAtom);
  const [isProcessing] = useAtom(isProcessingAtom);

  const isLoading = isProcessing && notes.some(n => n.status === 'processing');

  if (isLoading && notes.length <= 1) {
     return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(1)].map((_, i) => (
           <div key={i} className="flex flex-col space-y-3">
             <Skeleton className="h-[200px] w-full rounded-xl" />
             <div className="space-y-2">
               <Skeleton className="h-4 w-[250px]" />
               <Skeleton className="h-4 w-[200px]" />
             </div>
           </div>
        ))}
      </div>
    );
  }
  
  const sortedNotes = [...notes].sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());

  // TODO: switch to Firestore-backed subscription in next change. For now we continue to show local atom.




  if (notes.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-xl">
        <h2 className="text-xl font-medium text-muted-foreground">
          Your transcribed notes will appear here.
        </h2>
        <p className="text-muted-foreground">
          Upload an image to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedNotes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
