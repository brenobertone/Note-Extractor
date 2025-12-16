import { atom } from "jotai";
import type { Note } from "./types";

export const notesAtom = atom<Note[]>([]);
export const isProcessingAtom = atom(false);
