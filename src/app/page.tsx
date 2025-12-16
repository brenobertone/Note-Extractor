"use client";

import { useAtom } from "jotai";
import { isProcessingAtom, notesAtom } from "@/lib/store";
import type { Note } from "@/lib/types";
import { fileToDataUri } from "@/lib/utils";
import { transcribeImage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

import Header from "@/components/layout/header";
import ImageUploader from "@/components/image-uploader";
import NoteList from "@/components/note-list";
import { initFirebase } from "@/firebase/client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom);
  const [notes, setNotes] = useAtom(notesAtom);
  const { toast } = useToast();

  // Initialize firebase on client
  const { auth, storage, firestore } = initFirebase();

  // Subscribe to Firestore notes only after auth state is known.
  useEffect(() => {
    let notesUnsub: (() => void) | undefined;
    let authUnsub: (() => void) | undefined;

    try {
      authUnsub = auth.onAuthStateChanged((user) => {
        // If user signed in -> subscribe to their notes
        if (user) {
          const uid = user.uid;
          const notesQuery = query(
            collection(firestore, 'notes'),
            where('uid', '==', uid),
            orderBy('createdAt', 'desc')
          );

          // unsubscribe previous subscription if any
          if (notesUnsub) {
            notesUnsub();
            notesUnsub = undefined;
          }

          notesUnsub = onSnapshot(notesQuery, (snapshot) => {
            const docs: Note[] = snapshot.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                uid: data.uid,
                title: data.title ?? null,
                markdownContent: data.markdownContent ?? null,
                status: (data.status as any) ?? 'completed',
                error: data.error ?? undefined,
                uploadTimestamp: data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date(),
                previewUrl: undefined,
                imageUrl: data.imageUrl ?? undefined,
                imagePath: data.imagePath ?? undefined,
              } as Note;
            });

            // Merge remote snapshot with any local optimistic notes (e.g., processing items)
            setNotes((prev) => {
              try {
                const remoteIds = new Set(docs.map((d) => d.id));
                // preserve local notes that are not present in remote and are still processing
                const preserved = prev.filter((p) => !remoteIds.has(p.id) && p.status === 'processing');
                return [...docs, ...preserved];
              } catch (e) {
                return docs;
              }
            });
          }, (err) => {
            console.error('notes onSnapshot error', err);
          });
        } else {
          // Not signed in — clear local notes and unsubscribe any note listener
          setNotes([]);
          if (notesUnsub) {
            notesUnsub();
            notesUnsub = undefined;
          }
        }
      });
    } catch (err) {
      console.warn('Could not subscribe to auth/notes', err);
    }

    return () => {
      if (notesUnsub) notesUnsub();
      if (authUnsub) authUnsub();
    };
  }, []);
  const handleImageUpload = async (file: File) => {
    if (isProcessing) {
      toast({
        title: "Please wait",
        description: "An image is already being processed.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Ensure the user is signed in before creating optimistic note/preview.
    const userAtStart = auth.currentUser;
    if (!userAtStart) {
      toast({
        title: "Sign in required",
        description: "Please sign in with Google to save notes.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    const noteId = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);

    const newNote: Note = {
      id: noteId,
      uid: userAtStart.uid,
      status: "processing",
      title: "Processing...",
      markdownContent: "",
      uploadTimestamp: new Date(),
      previewUrl: previewUrl,
    };

    // Optimistic UI update while we upload + process
    setNotes((prev) => [newNote, ...prev]);

    try {
      // Ensure the user is signed in before uploading. Sign-in is a user gesture handled by the header.
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in with Google to save notes.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }
      const uid = user.uid;
      const ext = file.name.split('.').pop();
      const path = `users/${uid}/notes/${noteId}/original.${ext}`;
      const sRef = storageRef(storage, path);

      // Upload bytes and get download URL
      await uploadBytes(sRef, file);
      const downloadUrl = await getDownloadURL(sRef);

      // Persist initial doc in firestore
      const noteDocRef = doc(firestore, 'notes', noteId);
      await setDoc(noteDocRef, {
        uid,
        status: 'processing',
        title: null,
        markdownContent: null,
        error: null,
        createdAt: serverTimestamp(),
        imageUrl: downloadUrl,
        imagePath: path,
      });

      // Send the publicly accessible download URL to the AI flow (avoid base64 data URIs)
      const result = await transcribeImage(noteId, downloadUrl);

      if (result.error || !result.data) {
        throw new Error(result.error || "Failed to get data from server.");
      }

      // Update firestore doc with completed data (transcribeImage also attempts this)
      await setDoc(noteDocRef, {
        status: 'completed',
        title: result.data.title,
        markdownContent: result.data.markdownContent,
      }, { merge: true });

      // local atom will be refreshed by the onSnapshot listener

    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";

      // Mark local note as error; firestore doc updated where possible
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, status: 'error', error: errorMessage } : n))
      );

      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <ImageUploader
            onImageUpload={handleImageUpload}
            isProcessing={isProcessing}
          />
          <NoteList />
        </div>
      </main>
    </div>
  );
}
