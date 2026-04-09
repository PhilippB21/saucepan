// ─── Firebase Datenbank-URL ────────────────────────────────────────────────────
const FIREBASE_URL = "https://saucepan-23db2-default-rtdb.europe-west1.firebasedatabase.app/essensplan";
// ──────────────────────────────────────────────────────────────────────────────

export const FIREBASE_NOT_CONFIGURED = FIREBASE_URL.includes("DEIN-PROJEKT");

export async function loadFromFirebase(user) {
  const token = user ? await user.getIdToken() : null;
  const url = token ? `${FIREBASE_URL}.json?auth=${token}` : `${FIREBASE_URL}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firebase Ladefehler: ${res.status}`);
  return await res.json();
}

export async function saveToFirebase(data, user) {
  const token = await user.getIdToken();
  const res = await fetch(`${FIREBASE_URL}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase Speicherfehler: ${res.status}`);
}

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// ─── Firebase Web-App Konfiguration ───────────────────────────────────────────
// Werte kommen aus .env.local (nie committen!) – siehe .env.example als Vorlage
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
// ──────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
