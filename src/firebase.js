import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

// ─── Firebase Web-App Konfiguration ───────────────────────────────────────────
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

const FIREBASE_BASE = import.meta.env.VITE_FIREBASE_DATABASE_URL;
export const FIREBASE_NOT_CONFIGURED = !FIREBASE_BASE || FIREBASE_BASE.includes("DEIN-PROJEKT");

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
export function signInWithGoogle() { return signInWithPopup(auth, googleProvider); }
export function signOutUser() { return signOut(auth); }
export function onAuthChange(callback) { return onAuthStateChanged(auth, callback); }

async function getToken(user) { return user.getIdToken(); }

// ── User-Profil ───────────────────────────────────────────────────────────────

export async function getUserPlan(user) {
  const token = await getToken(user);
  const res = await fetch(`${FIREBASE_BASE}/users/${user.uid}/planId.json?auth=${token}`);
  if (!res.ok) throw new Error(`Fehler: ${res.status}`);
  return await res.json(); // planId-String oder null
}

async function saveUserProfile(user, planId, token) {
  const res = await fetch(`${FIREBASE_BASE}/users/${user.uid}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId, email: user.email, displayName: user.displayName }),
  });
  if (!res.ok) throw new Error(`Profil speichern fehlgeschlagen: ${res.status}`);
}

export async function clearUserPlan(user) {
  const token = await getToken(user);
  await fetch(`${FIREBASE_BASE}/users/${user.uid}/planId.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(null),
  });
}

// ── Plan-Verwaltung ───────────────────────────────────────────────────────────

function generatePlanId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createPlan(user, name) {
  const token = await getToken(user);
  const planId = generatePlanId();
  const res = await fetch(`${FIREBASE_BASE}/essensplan/${planId}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      members: { [user.uid]: true },
      recipes: {},
      plans: {},
    }),
  });
  if (!res.ok) throw new Error(`Plan erstellen fehlgeschlagen: ${res.status}`);
  await saveUserProfile(user, planId, token);
  return planId;
}

export async function getPlanName(user, planId) {
  const token = await getToken(user);
  const res = await fetch(`${FIREBASE_BASE}/essensplan/${planId}/name.json?auth=${token}`);
  if (!res.ok) return null;
  return await res.json(); // Name-String oder null
}

export async function joinPlan(user, planId) {
  const token = await getToken(user);
  const name = await getPlanName(user, planId);
  if (!name) throw new Error("Plan nicht gefunden. Bitte Code prüfen.");
  const res = await fetch(`${FIREBASE_BASE}/essensplan/${planId}/members/${user.uid}.json?auth=${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(true),
  });
  if (!res.ok) throw new Error(`Beitreten fehlgeschlagen: ${res.status}`);
  await saveUserProfile(user, planId, token);
}

// ── Daten laden/speichern ─────────────────────────────────────────────────────

export async function loadFromFirebase(user, planId) {
  const token = await getToken(user);
  const res = await fetch(`${FIREBASE_BASE}/essensplan/${planId}.json?auth=${token}`);
  if (!res.ok) throw new Error(`Firebase Ladefehler: ${res.status}`);
  return await res.json();
}

export async function saveToFirebase(data, user, planId) {
  const token = await getToken(user);
  // PATCH statt PUT — überschreibt nicht name/members
  const res = await fetch(`${FIREBASE_BASE}/essensplan/${planId}.json?auth=${token}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase Speicherfehler: ${res.status}`);
}
