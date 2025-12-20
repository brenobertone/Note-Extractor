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
      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                 <Button type="button" variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                 </Button>
                 <CardTitle>Edit Note</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  {!imageUrl ? (
                    <div className="h-48 md:h-full rounded-md overflow-hidden border bg-card flex items-center justify-center">
                      <Skeleton className="h-24 w-24" />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-md overflow-hidden border">
                      <Image
                        src={imageUrl}
                        alt={title || 'Note image'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div className="md:flex-1 space-y-4">
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
                      className="h-64"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">Save Changes</Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}
