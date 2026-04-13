# Saucepan – Familien-Essensplan

Wöchentlicher Essensplaner für mehrere Geräte und Personen. Mehrere Nutzer können gemeinsam an einem Essensplan arbeiten. Daten werden in Firebase Realtime Database gespeichert und sind in Echtzeit synchronisiert.

## Voraussetzungen

- [Node.js](https://nodejs.org) (LTS-Version)
- Ein [Firebase-Konto](https://firebase.google.com) (kostenlos)

---

## 1. Firebase einrichten

### 1.1 Projekt anlegen

1. [Firebase Console](https://console.firebase.google.com) öffnen
2. **„Projekt hinzufügen"** → Namen vergeben (z. B. `saucepan`) → Projekt erstellen
3. Im Projekt: linkes Menü → **„Erstellen" → „Realtime Database"**
4. **„Datenbank erstellen"** → Standort wählen → Regeln im nächsten Schritt manuell setzen (siehe [Abschnitt 4](#4-datenbankregeln))

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

Die App enthält keine eingebetteten Fallback-Daten – sie arbeitet ausschließlich mit dem, was in Firebase steht. Die Rezeptliste muss daher **einmalig** per Seed-Skript in die Datenbank geschrieben werden.

```bash
npm run dev
```

Dann im Browser öffnen:

```
http://localhost:5173/scripts/seed.html
```

1. **„Mit Google anmelden"** klicken
2. Das Skript erkennt automatisch den Essensplan des angemeldeten Nutzers und trägt die Plan-ID ein
3. Falls noch kein Plan existiert, das Feld leer lassen – es wird automatisch ein neuer Plan angelegt
4. **„Rezepte schreiben"** klicken
5. Nach der Erfolgsmeldung das Fenster schließen

> Bei einem **bestehenden Plan** werden nur die Rezepte überschrieben – Pläne und Mitglieder bleiben erhalten.  
> Bei einem **neuen Plan** wird der Plan vollständig angelegt und mit dem angemeldeten Konto verknüpft.

---

## 4. Datenbankregeln

In der Firebase Console unter **Realtime Database → Regeln** folgende Regeln setzen:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    },
    "essensplan": {
      "$planId": {
        ".read": "auth != null && data.child('members').child(auth.uid).val() === true",
        ".write": "auth != null && (data.child('members').child(auth.uid).val() === true || !data.exists())",
        "name": { ".read": "auth != null" },
        "members": {
          "$uid": { ".write": "auth != null && auth.uid === $uid && !data.exists()" }
        }
      }
    }
  }
}
```

**Erklärung der Regeln:**

| Pfad | Regel |
|---|---|
| `/users/{uid}` | Nur der jeweilige Nutzer kann sein Profil lesen und schreiben |
| `/essensplan/{planId}` (lesen) | Nur Mitglieder des Plans (`members.{uid} === true`) |
| `/essensplan/{planId}` (schreiben) | Mitglieder, oder einmalig beim Anlegen eines neuen Plans |
| `/essensplan/{planId}/name` | Jeder angemeldete Nutzer kann den Plan-Namen lesen (für Einladungsflow) |
| `/essensplan/{planId}/members/{uid}` | Jeder Nutzer kann sich selbst einmalig als Mitglied eintragen (Beitreten per Code) |

### Authorized Domains

Firebase Console → **Authentication** → **Settings** → **Authorized domains**:
- `localhost` ist bereits eingetragen (für lokale Entwicklung)
- Nach dem Deploy: `DEIN-PROJEKT.web.app` hinzufügen

---

## 5. Mehrere Nutzer & Einladungen

Jeder Nutzer kann genau einem Essensplan angehören. Ein Plan kann von mehreren Personen gemeinsam verwaltet werden.

### Ersten Plan erstellen

1. App öffnen und mit Google anmelden
2. **„Neuer Plan"** → Namen eingeben → **„Plan erstellen"**
3. Der 6-stellige Einladungscode erscheint im Header (z. B. `X4K9QM`)

### Weitere Personen einladen

1. Einladungscode im Header antippen → Code kopieren
2. Code an die andere Person weiterschicken
3. Diese Person öffnet die App, wählt **„Beitreten"** und gibt den Code ein

### Plan verlassen

Einladungscode im Header antippen → **„Plan verlassen"** → der Nutzer kann danach einem anderen Plan beitreten oder einen neuen erstellen.

---

## 6. Lokal testen

```bash
npm run dev
```

Die App ist unter [http://localhost:5173](http://localhost:5173) erreichbar.

---

## 7. Deployen

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
├── essensplan.jsx        # Haupt-Komponente (Login, Plan-Auswahl, App-Shell)
├── src/
│   ├── main.jsx          # React-Einstiegspunkt
│   ├── firebase.js       # Firebase Auth + DB-Zugriff (inkl. Plan-Verwaltung)
│   ├── usePlanAccess.js  # Hook: Auth-Status + Plan-Zugehörigkeit
│   ├── useMealPlan.js    # Hook: Wochenpläne, Rezepte, Firebase-Sync
│   ├── WeekView.jsx      # Wochenansicht mit Tageskarten
│   ├── EditOverlay.jsx   # Vollbild-Bearbeitungsformular
│   ├── recipes.js        # Rezeptliste (für Seed-Skript)
│   ├── utils.js          # Datumsfunktionen, nameToId, KW-Berechnung
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
