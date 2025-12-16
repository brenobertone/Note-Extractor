import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Fallback to the firebase-sdks.json file included in the repo when NEXT_PUBLIC_* env
// vars are not provided at build time (useful for App Hosting builds that forget to set
// BUILD-time env vars). resolveJsonModule is enabled in tsconfig so importing JSON works.
import firebaseSdks from "../../firebase-sdks.json";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;
let storage: FirebaseStorage | undefined;

function requireBrowser() {
  if (typeof window === 'undefined') {
    throw new Error('initFirebase() must only be called in the browser. Ensure this code runs on the client (inside a client component).');
  }
}

function assertEnv() {
  const missing: string[] = [];

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? (firebaseSdks as any)?.apiKey;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? (firebaseSdks as any)?.authDomain;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? (firebaseSdks as any)?.projectId;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? (firebaseSdks as any)?.storageBucket;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? (firebaseSdks as any)?.messagingSenderId;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? (firebaseSdks as any)?.appId;

  if (!apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  if (missing.length > 0) {
    throw new Error(
      `Missing NEXT_PUBLIC Firebase env vars: ${missing.join(', ')}. Make sure these are configured in App Hosting (apphosting.yaml) and available at BUILD time, or provide a firebase-sdks.json with the public config.`
    );
  }
}

export function initFirebase() {
  // This library is intended for client-side usage only
  requireBrowser();

  // Ensure environment variables are set (helps surface clear errors during build)
  assertEnv();

  if (!app) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? (firebaseSdks as any)?.apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? (firebaseSdks as any)?.authDomain,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? (firebaseSdks as any)?.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? (firebaseSdks as any)?.storageBucket,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? (firebaseSdks as any)?.messagingSenderId,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? (firebaseSdks as any)?.appId,
    } as const;

    // Avoid re-initializing if another bundle already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0] as FirebaseApp;
    }

    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
  }

  return { app: app!, auth: auth!, firestore: firestore!, storage: storage! };
}

export function getFirebaseAuth() {
  requireBrowser();
  if (!auth) {
    initFirebase();
  }
  return auth!;
}
