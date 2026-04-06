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
4. **„Datenbank erstellen"** → Standort wählen → **Testmodus** auswählen → Fertig

> Der Testmodus erlaubt 30 Tage lang uneingeschränkten Lese-/Schreibzugriff. Danach müssen die Regeln angepasst werden (siehe [Abschnitt 5](#5-sicherheitsregeln-optional)).

### 1.2 Datenbank-URL eintragen

Die URL der Datenbank erscheint oben in der Realtime-Database-Übersicht und sieht so aus:
```
https://DEIN-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app
```

Diese URL in `essensplan.jsx` eintragen (Zeile 7):
```js
const FIREBASE_URL = "https://DEIN-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app/essensplan";
```

---

## 2. Projekt aufsetzen

```bash
# Repository klonen oder Ordner öffnen
cd saucepan

# Dependencies installieren
npm install

# Firebase CLI global installieren
npm install -g firebase-tools

# Bei Firebase anmelden
firebase login

# Firebase-Projekt verknüpfen
firebase use --add
# → Projekt aus der Liste wählen, Alias "default" vergeben
```

---

## 3. Lokal testen

```bash
npm run dev
```

Die App ist dann unter [http://localhost:5173](http://localhost:5173) erreichbar.

Beim ersten Start werden Beispieldaten automatisch in Firebase geschrieben. Öffne die App auf einem zweiten Gerät (gleiche URL oder nach dem Deploy) – beide Geräte zeigen denselben Essensplan und synchronisieren sich alle 30 Sekunden.

---

## 4. Deployen

```bash
# Produktions-Build erstellen
npm run build

# Auf Firebase Hosting deployen
firebase deploy
```

Nach dem Deploy gibt Firebase eine öffentliche URL aus:
```
https://DEIN-PROJEKT.web.app
```

Diese URL ist von jedem Gerät und Browser erreichbar.

### Zukünftige Updates deployen

```bash
npm run build && firebase deploy
```

---

## 5. Google-Anmeldung einrichten

Die App zeigt den Essensplan für alle ohne Login (Read-only). Bearbeiten ist nur nach Anmeldung möglich.

### 5.1 Google Sign-In in Firebase aktivieren

1. Firebase Console → **Authentication** → **Sign-in method**
2. **Google** aktivieren → Projekt-Support-E-Mail angeben → Speichern

### 5.2 Firebase Web-App Konfiguration eintragen

1. Firebase Console → **Projekteinstellungen** (Zahnrad) → **Deine Apps** → Web-App auswählen
2. Unter **SDK-Konfiguration** das Objekt kopieren
3. Die Werte in `src/firebase.js` eintragen:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "DEIN-PROJEKT.firebaseapp.com",
  databaseURL: "https://DEIN-PROJEKT-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "DEIN-PROJEKT",
  storageBucket: "DEIN-PROJEKT.appspot.com",
  messagingSenderId: "...",
  appId: "...",
};
```

### 5.3 Authorized Domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains**:
- `localhost` ist bereits eingetragen (für lokale Entwicklung)
- Nach dem Deploy: `DEIN-PROJEKT.web.app` hinzufügen

---

## 6. Datenbankregeln

In der Firebase Console unter **Realtime Database → Regeln** diese Regeln setzen:

**Lesen öffentlich, Schreiben nur mit Login (empfohlen):**
```json
{
  "rules": {
    ".read": true,
    ".write": "auth != null"
  }
}
```

---

## Projektstruktur

```
saucepan/
├── essensplan.jsx     # Haupt-Komponente (App-Logik + UI)
├── src/
│   ├── main.jsx       # React-Einstiegspunkt
│   └── firebase.js    # Firebase Auth-Konfiguration
├── index.html         # HTML-Shell
├── vite.config.js     # Vite-Konfiguration
├── firebase.json      # Firebase Hosting-Konfiguration
└── package.json       # Dependencies und Scripts
```

## Verfügbare Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver starten (localhost:5173) |
| `npm run build` | Produktions-Build in `dist/` erstellen |
| `npm run preview` | Fertigen Build lokal vorschauen |
| `firebase deploy` | App auf Firebase Hosting deployen |
