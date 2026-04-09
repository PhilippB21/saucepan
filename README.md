# Saucepan – Familien-Essensplan

Wöchentlicher Essensplaner für mehrere Geräte und Personen. Daten werden in Firebase Realtime Database gespeichert und sind in Echtzeit synchronisiert.

## Voraussetzungen

- [Node.js](https://nodejs.org) (LTS-Version)
- Ein [Firebase-Konto](https://firebase.google.com) (kostenlos)

---

## 1. Firebase einrichten

### 1.1 Projekt anlegen

1. [Firebase Console](https://console.firebase.google.com) öffnen
2. **„Projekt hinzufügen"** → Namen vergeben (z. B. `saucepan`) → Projekt erstellen
3. Im Projekt: linkes Menü → **„Erstellen" → „Realtime Database"**
4. **„Datenbank erstellen"** → Standort wählen → Im nächsten Schritt die Regeln manuell setzen (siehe [Abschnitt 4](#4-datenbankregeln))

### 1.2 Google Sign-In aktivieren

1. Firebase Console → **Authentication** → **Sign-in method**
2. **Google** aktivieren → Projekt-Support-E-Mail angeben → Speichern

### 1.3 Firebase Web-App Konfiguration

1. Firebase Console → **Projekteinstellungen** (Zahnrad) → **Deine Apps** → Web-App auswählen
2. Unter **SDK-Konfiguration** die Werte kopieren und in `.env.local` eintragen:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=DEIN-PROJEKT.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://DEIN-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=DEIN-PROJEKT
VITE_FIREBASE_STORAGE_BUCKET=DEIN-PROJEKT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> Vorlage: `.env.example`. Die Datei `.env.local` niemals committen.

---

## 2. Projekt aufsetzen

```bash
npm install
npm install -g firebase-tools
firebase login
firebase use --add   # Projekt aus der Liste wählen, Alias "default" vergeben
```

---

## 3. Datenbank initial befüllen

Die App enthält keine eingebetteten Fallback-Daten mehr – sie arbeitet ausschließlich mit dem, was in Firebase steht. Die Rezeptliste muss daher **einmalig** per Seed-Skript in die Datenbank geschrieben werden.

```bash
npm run dev
```

Dann im Browser öffnen:

```
http://localhost:5173/scripts/seed.html
```

1. **„Mit Google anmelden"** klicken und ein erlaubtes Konto verwenden
2. **„Datenbank befüllen"** klicken
3. Nach der Erfolgsmeldung das Fenster schließen

Das Skript schreibt alle Rezepte sowie leere Pläne und einen leeren Verlauf. **Bereits vorhandene Daten in Firebase werden dabei überschrieben.**

---

## 4. Datenbankregeln

In der Firebase Console unter **Realtime Database → Regeln** diese Regeln setzen und die erlaubten E-Mail-Adressen anpassen:

```json
{
  "rules": {
    ".read": "auth != null && (auth.token.email === 'adresse1@gmail.com' || auth.token.email === 'adresse2@gmail.com')",
    ".write": "auth != null && (auth.token.email === 'adresse1@gmail.com' || auth.token.email === 'adresse2@gmail.com')"
  }
}
```

Die gleichen Adressen müssen auch in `essensplan.jsx` in der `ALLOWED_EMAILS`-Liste stehen:

```js
const ALLOWED_EMAILS = ["adresse1@gmail.com", "adresse2@gmail.com"];
```

### Authorized Domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains**:
- `localhost` ist bereits eingetragen (für lokale Entwicklung)
- Nach dem Deploy: `DEIN-PROJEKT.web.app` hinzufügen

---

## 5. Lokal testen

```bash
npm run dev
```

Die App ist unter [http://localhost:5173](http://localhost:5173) erreichbar.

---

## 6. Deployen

```bash
npm run build
firebase deploy
```

Nach dem Deploy gibt Firebase eine öffentliche URL aus:
```
https://DEIN-PROJEKT.web.app
```

### Zukünftige Updates

```bash
npm run build && firebase deploy
```

---

## Projektstruktur

```
saucepan/
├── essensplan.jsx        # Haupt-Komponente
├── src/
│   ├── main.jsx          # React-Einstiegspunkt
│   ├── firebase.js       # Firebase Auth + DB-Zugriff
│   ├── useMealPlan.js    # State-Hook (Firebase, Pläne, Rezepte)
│   ├── WeekView.jsx      # Wochenansicht
│   ├── EditOverlay.jsx   # Vollbild-Bearbeitungsformular
│   ├── recipes.js        # Rezeptliste (Seed-Daten)
│   ├── utils.js          # Datumsfunktionen, nameToId
│   └── styles.js         # Gemeinsame Button-Styles
├── scripts/
│   └── seed.html         # Einmaliges Befüllen der Datenbank
├── index.html
├── vite.config.js
├── firebase.json
└── package.json
```

## Verfügbare Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten (localhost:5173) |
| `npm run build` | Produktions-Build in `dist/` erstellen |
| `npm run preview` | Fertigen Build lokal vorschauen |
| `firebase deploy` | App auf Firebase Hosting deployen |
