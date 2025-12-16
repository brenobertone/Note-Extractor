
"use server";

import { extractTitleAndConvertImageToMarkdown } from "@/ai/flows/extract-title-and-convert-image-to-markdown";

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

    // Server actions shouldn't initialize the browser Firebase SDK.
    // The client will update Firestore when it has network access.
    // If you want server-side writes, initialize and use the Admin SDK here instead.

    return { data: { title: result.title, markdownContent: result.markdownContent } };
  } catch (err) {
    console.error('transcribeImage error', err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}
