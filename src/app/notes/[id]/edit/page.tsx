"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Header from "@/components/layout/header";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/lib/types";
import { useAtom } from "jotai";
import { notesAtom } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { initFirebase } from "@/firebase/client";
import { doc, setDoc } from "firebase/firestore";

export default function EditNotePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const noteId = Array.isArray(id) ? id[0] : id;
  const [notes, setNotes] = useAtom(notesAtom);
  const note = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setMarkdownContent(note.markdownContent || "");
    }
  }, [note]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!note) {
      setImageUrl(null);
      return;
    }

    // Prefer persisted imageUrl, fallback to previewUrl
    if (note.imageUrl) {
      setImageUrl(note.imageUrl);
      return;
    }
    if (note.previewUrl) {
      setImageUrl(note.previewUrl);
    }

    return () => {
      if (note?.previewUrl && note.status !== 'processing') {
        try { URL.revokeObjectURL(note.previewUrl); } catch (e) { /* ignore */ }
      }
    };
  }, [note?.previewUrl, note?.status, note?.imageUrl, note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return;

    // Persist change to firestore if available
    try {
      const noteId = Array.isArray(id) ? id[0] : id;
      const { firestore } = initFirebase();
      if (noteId) {
        const noteDocRef = doc(firestore, 'notes', noteId);
        await setDoc(noteDocRef, { title, markdownContent }, { merge: true });
      }
    } catch (err) {
      // ignore if firestore not configured in env
      console.warn('Could not update firestore doc', err);
    }

    setNotes(
      notes.map((n) =>
        n.id === (Array.isArray(id) ? id[0] : id) ? { ...n, title, markdownContent } : n
      )
    );

    toast({
      title: "Note Updated",
      description: "Your note has been successfully updated.",
    });
    router.push("/");
  };

  if (!note) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-md" />
                            <Skeleton className="h-8 w-1/3" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-none mx-auto p-0 md:p-0">
        <form onSubmit={handleSubmit} className="min-h-[calc(100vh-4rem)]">
          <div className="flex flex-col md:flex-row">
            {/* Image pane */}
            <div className="md:w-3/5 md:h-[calc(100vh-4rem)] md:sticky md:top-16 bg-black flex items-center justify-center relative">
              {/* Floating back button overlay */}
              <div className="absolute top-4 left-4 z-20">
                <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                  <ArrowLeft />
                </Button>
              </div>

              {!imageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="h-24 w-24" />
                </div>
              ) : (
                <div className="relative w-full h-[calc(100vh-4rem)]">
                  <Image
                    src={imageUrl}
                    alt={title || 'Note image'}
                    fill
                    sizes="100vw"
                    className="object-contain bg-black"
                  />
                </div>
              )}
            </div>

            {/* Editor pane */}
            <div className="md:w-2/5 p-4 md:p-8 overflow-auto">
              <Card className="w-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                     <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                     </Button>
                     <CardTitle>Edit Note</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="markdownContent">Markdown Content</Label>
                      <Textarea
                        id="markdownContent"
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        required
                        className="min-h-[60vh]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
