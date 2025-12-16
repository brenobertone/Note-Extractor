"use client";

import { NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { initFirebase } from "@/firebase/client";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export default function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const { auth } = initFirebase();
      if (auth.currentUser) {
        setUserEmail(auth.currentUser.email ?? null);
      }

      const unsub = auth.onAuthStateChanged((u) => {
        setUserEmail(u ? u.email ?? null : null);
      });

      return () => unsub();
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSignIn = async () => {
    try {
      const { auth } = initFirebase();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("signIn failed", err);
    }
  };

  const handleSignOut = async () => {
    try {
      const { auth } = initFirebase();
      await signOut(auth);
    } catch (err) {
      console.error("signOut failed", err);
    }
  };

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <NotebookPen className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Note Image Transcriber
          </h1>
        </div>
        <div>
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{userEmail}</span>
              <button onClick={handleSignOut} className="text-sm text-destructive">Sign out</button>
            </div>
          ) : (
            <button onClick={handleSignIn} className="text-sm">Sign in with Google</button>
          )}
        </div>
      </div>
    </header>
  );
}
