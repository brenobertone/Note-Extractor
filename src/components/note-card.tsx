"use client";

import Image from "next/image";
import Link from 'next/link';
import {
  FileDown,
  Loader2,
  AlertTriangle,
  Trash2,
  Pencil,
} from "lucide-react";
import type { Note } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAtom } from "jotai";
import { notesAtom } from "@/lib/store";
import { useEffect, useState } from "react";
import { initFirebase } from "@/firebase/client";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { doc, deleteDoc } from "firebase/firestore";

type NoteCardProps = {
  note: Note;
};

export default function NoteCard({ note }: NoteCardProps) {
  const [notes, setNotes] = useAtom(notesAtom);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Prefer persisted imageUrl, fallback to previewUrl
    if (note.imageUrl) {
      setImageUrl(note.imageUrl);
      return;
    }
    if (note.previewUrl) {
      setImageUrl(note.previewUrl)
    }
    // Clean up the object URL when the component unmounts or the URL changes
    return () => {
      if (note.previewUrl && note.status !== 'processing') {
        try { URL.revokeObjectURL(note.previewUrl); } catch (e) { /* ignore */ }
      }
    };
  }, [note.previewUrl, note.status, note.imageUrl]);

  const handleDownload = () => {
    if (!note.markdownContent || !note.title) return;

    const blob = new Blob([note.markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleDelete = async () => {
    try {
      const { firestore, storage } = initFirebase();

      // delete storage object if available
      if (note.imagePath) {
        try {
          const sRef = storageRef(storage, note.imagePath);
          await deleteObject(sRef);
        } catch (err) {
          // ignore storage delete errors
          console.warn('Failed to delete storage object', err);
        }
      }

      // delete firestore document
      try {
        const noteDocRef = doc(firestore, 'notes', note.id);
        await deleteDoc(noteDocRef);
      } catch (err) {
        console.warn('Failed to delete firestore document', err);
      }
    } catch (err) {
      console.error('delete flow failed', err);
    } finally {
      setNotes(notes.filter((n) => n.id !== note.id));
    }
  };

  const getStatusBadge = () => {
    switch (note.status) {
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground">Completed</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          {note.status === "processing" ? (
            <Skeleton className="h-6 w-3/4" />
          ) : (
            <CardTitle className="text-lg font-semibold leading-tight truncate">
              {note.title || "Untitled Note"}
            </CardTitle>
          )}
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
          <div className="relative aspect-video rounded-md overflow-hidden border cursor-pointer">
            {!imageUrl ? (
              <Skeleton className="h-full w-full" />
            ) : (
                <Link href={`/notes/${note.id}/edit`} passHref>
                    <Image
                    src={imageUrl}
                    alt={note.title || "Note preview"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    />
                </Link>
            )}
            {note.status === "processing" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {note.status === "completed" && (
          <>
            <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
              <FileDown className="mr-2 h-4 w-4" />
            </Button>
            <Link href={`/notes/${note.id}/edit`} passHref className="flex-1">
               <Button variant="outline" className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
               </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        {note.status === "error" && (
          <Alert variant="destructive" className="w-full">
             <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Transcription Failed</AlertTitle>
            <AlertDescription className="text-xs">
              {note.error || "An unknown error occurred."}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
