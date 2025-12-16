
"use server";

import { extractTitleAndConvertImageToMarkdown } from "@/ai/flows/extract-title-and-convert-image-to-markdown";
import { initFirebase } from "@/firebase/client";
import { doc, setDoc } from "firebase/firestore";

type ActionResult = {
  data?: { title: string; markdownContent: string };
  error?: string;
};

export async function transcribeImage(
  noteId: string,
  imageUrl: string
): Promise<ActionResult> {
  try {
    const result = await extractTitleAndConvertImageToMarkdown({ noteId, imageUrl });

    if (!result || !result.title || !result.markdownContent) {
      return { error: 'AI returned an invalid response' };
    }

    // Try to update firestore doc if firebase initialized
    try {
      const { firestore } = initFirebase();
      const noteDocRef = doc(firestore, 'notes', noteId);
      await setDoc(noteDocRef, {
        status: 'completed',
        title: result.title,
        markdownContent: result.markdownContent,
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update firestore from transcribeImage', err);
    }

    return { data: { title: result.title, markdownContent: result.markdownContent } };
  } catch (err) {
    console.error('transcribeImage error', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
