# Note Image Transcriber

Convert photos of handwritten notes into clean **Markdown** using **Gemini** (via **Genkit**), and store everything in **Firebase** (Auth, Firestore, Storage).

## What it does

1. You **sign in with Google**.
2. You upload (or capture) an image of a note.
3. The app uploads the original image to **Firebase Storage**.
4. A server action calls a **Genkit flow** backed by **Google Gemini** to:
   - extract a **title**
   - convert the note content into **Markdown** (optimized for Obsidian-style notes)
5. The generated title + markdown are saved to **Cloud Firestore** and shown in the UI.

## Features

- **Google sign-in** (Firebase Auth)
- **Image upload** with optimistic UI (shows a “Processing” card immediately)
- **AI transcription** (Gemini via Genkit)
- **Persistent notes**
  - Firestore document per note (status/title/markdown)
  - Storage object for the original image
- **Edit note** page (updates Firestore)
- **Download as `.md`**
- **Delete note** (removes Firestore doc + Storage object when available)

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **State:** Jotai (used for optimistic client state; Firestore snapshot is the source of truth once loaded)
- **Firebase:** Auth (Google), Firestore, Storage
- **AI:** Genkit + `@genkit-ai/google-genai` (Gemini model configured in `src/ai/genkit.ts`)

## Implementation notes (high-level)

- **Main flow:** `src/app/page.tsx`
  - Subscribes to Firestore `notes` for the signed-in user (`where('uid','==',uid)` + `orderBy('createdAt','desc')`).
  - On upload, creates an optimistic note (`status: "processing"`) and uploads the image to Storage.
  - Creates/updates the Firestore document for the note.
  - Calls the server action to run the AI extraction.

- **Server action:** `src/app/actions.ts`
  - `transcribeImage(noteId, photoDataUri)` calls the Genkit flow and returns `{ title, markdownContent }`.
  - Attempts to merge the completed fields back into Firestore.

- **Genkit flow:** `src/ai/flows/extract-title-and-convert-image-to-markdown.ts`
  - Uses `ai.definePrompt` + `ai.defineFlow` with a Zod schema for structured output.

- **Storage layout:**
  - Original image is stored at: `users/<uid>/notes/<noteId>/original.<ext>`

## Prerequisites

- Node.js (LTS recommended)
- A Firebase project with:
  - **Authentication** enabled (Google provider)
  - **Cloud Firestore** enabled
  - **Storage** enabled
- A Gemini API key (used by Genkit)

## Environment variables

Create a `.env.local` (do **not** commit it) with:

```bash
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Genkit / Gemini
GEMINI_API_KEY=...
```

Firebase config is read in `src/firebase/client.ts`.

## Getting started

```bash
npm install
npm run dev
```

Then open:

- http://localhost:9002

## Genkit (optional)

If you want to run the Genkit developer UI/tools:

```bash
npm run genkit:dev
# or
npm run genkit:watch
```

## Scripts

- `npm run dev` — Next dev server (port **9002**)
- `npm run build` / `npm run start` — production build/run
- `npm run lint` — lint
- `npm run typecheck` — TypeScript typecheck

## License

TBD
