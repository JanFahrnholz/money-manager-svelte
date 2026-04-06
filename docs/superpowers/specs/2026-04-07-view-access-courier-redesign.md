# View-Zugang + Kurier-Netzwerk Redesign — Design Spec

## Context

Das bisherige Mirror-Kontakt Konzept (Scanner erstellt Kopie des Kontakts) ist konzeptionell falsch und verwirrend. Stattdessen: **Verlinkung = View-Zugang mit lokalem Cache**. Kein Mirror-Kontakt. Klare Trennung zwischen "Mein Buch" (Owner) und "Verlinkungen" (Viewer/Kurier).

## Kernprinzipien

1. **Kontakt ≠ User** — Ein Kontakt ist ein Bucheintrag. Ein User ist ein Gerät. Ein Kontakt KANN mit einem User verlinkt werden.
2. **Owner führt das Buch** — Nur der Owner erstellt Kontakte, bucht Transaktionen, verwaltet Balances.
3. **Viewer liest mit** — Ein verlinkter User sieht Read-Only was über ihn getrackt wird.
4. **Kurier arbeitet im Owner-Buch** — Ein Kurier bucht Einnahmen die im Buch des Managers landen.
5. **Jeder User hat zwei Bereiche**: "Mein Buch" (Owner) + "Verlinkungen" (Viewer/Kurier bei anderen).

## Rollen

| Rolle | Perspektive | Sieht | Kann |
|---|---|---|---|
| **Owner** | "Mein Buch" | Alle eigenen Kontakte, Transaktionen, Kurier-Netzwerk | Alles: CRUD Kontakte, Transaktionen, Kurier verwalten |
| **Viewer** | "Verlinkungen" | Eigenen Kontostand + Transaktionen beim Owner (Read-Only) | Nichts ändern |
| **Kurier** | "Verlinkungen" | Inventar/Umsatz/Bonus, ALLE Kontakte des Managers, eigene Kurier-Kontakte | Einnahmen buchen (reduziert Inventar), eigene Kontakte anlegen |

## Zwei Bereiche pro User

### "Mein Buch" (Owner-Modus)
- **Tab: Dashboard** — eigener Kontostand, Forderungen/Schulden, letzte Transaktionen
- **Tab: Kontakte** — eigene Kontakte mit Balances, Scores, Transaktionshistorie
- **Profil → Mein Netzwerk** — eigene Kuriere verwalten

### "Verlinkungen" (Verlinkt-Modus)  
- **Profil → Verlinkungen** — Liste der Pairs (Owner-Name + Rolle)
- **Viewer-Ansicht** — Tap auf Verlinkung → Read-Only: "Jan trackt: du schuldest 420€", Transaktionshistorie
- **Kurier-Dashboard** — Tap auf Kurier-Verlinkung → Inventar/Umsatz/Bonus, Kontakte zum Verkaufen

## Datenmodell

### `pairs` Tabelle (überarbeitet)
```sql
CREATE TABLE pairs (
  id TEXT PRIMARY KEY,
  remoteDeviceId TEXT NOT NULL,
  remotePublicKey TEXT NOT NULL,
  sharedKey TEXT NOT NULL,
  label TEXT DEFAULT '',           -- Name des Owners/Partners
  role TEXT DEFAULT 'viewer',      -- 'viewer' | 'courier'
  remoteContactId TEXT DEFAULT '', -- Kontakt-ID auf dem Owner-Gerät (welcher Kontakt bin ICH dort)
  created TEXT NOT NULL
);
```

Kein `localContactId` — der Viewer/Kurier hat keinen eigenen Kontakt für diese Verlinkung.

### Cache-Tabellen (neu)
```sql
CREATE TABLE remote_contacts (
  id TEXT PRIMARY KEY,
  pairId TEXT NOT NULL,
  name TEXT NOT NULL,
  balance REAL DEFAULT 0,
  score REAL DEFAULT 0,
  created TEXT,
  updated TEXT
);

CREATE TABLE remote_transactions (
  id TEXT PRIMARY KEY,
  pairId TEXT NOT NULL,
  contactId TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  info TEXT DEFAULT '',
  created TEXT,
  updated TEXT
);
```

### Bestehende Tabellen (unverändert)
- `contacts` — nur eigene Kontakte (Owner-Buch)
- `transactions` — nur eigene Transaktionen
- `courier_links` — nur eigene Kurier-Beziehungen
- `device`, `users` — unverändert

## QR-Pairing Flow

### QR-Payload (vom Owner generiert)
```json
{
  "deviceId": "owner_device_123",
  "publicKey": { "kty": "EC", ... },
  "contactId": "contact_abc",
  "contactName": "Dominik",
  "ownerName": "Jan"
}
```

### Flow
1. **Jan (Owner):** Kontakt "Dominik" → Action Sheet → "Verlinken" → zeigt QR
2. **Dominik (User):** Kontaktliste → QR-Scan-Button → scannt
3. **Dominik:** App erstellt Pair: `{ remoteDeviceId: jan, role: 'viewer', remoteContactId: contact_abc, label: 'Jan' }`
4. **Dominik:** Sendet Pairing-Request an Relay (unverschlüsselt: deviceId, publicKey, contactId)
5. **Jan:** Pollt Relay → findet Request → erstellt sein eigenes Pair
6. **Sync startet:** Jan sendet Dominiks Kontakt-Daten + Transaktionen verschlüsselt → Dominik cached in `remote_contacts` / `remote_transactions`

### Kurier-Beförderung (nach Verlinkung)
1. **Jan:** Kontakt "Dominik" Detail → "Zum Kurier machen"
2. **Jan:** Sendet `role_upgrade` Message via Relay → Dominik empfängt
3. **Dominik:** Pair-Rolle ändert sich von `viewer` → `courier`
4. **Jan:** Sendet alle seine Kontakte als Cache → Dominik empfängt in `remote_contacts`
5. **Dominik:** Sieht jetzt Kurier-Dashboard statt Read-Only View

## Sync-Protokoll

### Owner → Viewer (One-Way)
Bei jeder Änderung an einem verlinkten Kontakt oder dessen Transaktionen:
```json
{ "type": "sync", "table": "contacts|transactions", "action": "upsert|delete", "data": {...} }
```
Viewer speichert in `remote_contacts` / `remote_transactions`.

### Owner → Kurier (Push: Kontakte + Inventar)
Manager sendet:
- Alle seine Kontakte (für Kurier zum Verkaufen)
- CourierLink-Updates (Inventar aufstocken etc.)

### Kurier → Owner (Push: Einnahmen)
Kurier sendet:
- Neue Transaktionen die er erstellt hat
- Balance-Updates auf dem CourierLink

### Rolle-Upgrade Message
```json
{ "type": "role_upgrade", "newRole": "courier", "courierLinkData": { "bonusPercentage": 5 } }
```

## UI-Änderungen

### Owner-Gerät (keine großen Änderungen)
- Kontakt-Detail: "Verlinken" Button (zeigt QR) — wie jetzt
- Kontakt-Detail: "Zum Kurier machen" — wie jetzt
- Kontakt-Detail: zeigt "Verlinkt mit [Name]" wenn Pair existiert

### Viewer/Kurier-Gerät (NEU)
- **Kontaktliste: QR-Scan Button** in der Toolbar (wie jetzt) — aber erstellt KEINEN Kontakt mehr
- **Profil → Verlinkungen**: Liste aller Pairs
  - Jeder Eintrag zeigt: Owner-Name, Rolle (Viewer/Kurier)
  - Tap auf Viewer → Read-Only Seite mit Balance + Transaktionen (aus Cache)
  - Tap auf Kurier → Kurier-Dashboard (Inventar/Umsatz/Bonus, Kontakte, Einnahmen buchen)
- **Profil → Mein Netzwerk**: nur wenn User selbst Owner mit Kurieren ist (unverändert)

### Scanner-Flow (überarbeitet)
Aktuell: Scanner erstellt Mirror-Kontakt → **ENTFÄLLT**
Neu: Scanner erstellt nur ein Pair + sendet Pairing-Request

## Multi-Manager Kurier
- Jedes Pair ist unabhängig (eigener Schlüssel, eigenes Inventar)
- Kurier-Dashboard zeigt Liste seiner Manager: "Jan — Inv: 500€", "Lisa — Inv: 300€"
- Tap auf Manager → sieht dessen Kontakte + kann Einnahmen buchen
- Kontakte sind pro Manager getrennt (auch wenn gleiche Namen)

## Sub-Kurier
- Dominik ist Kurier von Jan (Verlinkt-Modus)
- Dominik nutzt seinen **Owner-Modus** um Kevin als Sub-Kurier einzuladen
- Kevin ist Kontakt in Dominiks Buch + Kurier
- Dominiks Einnahmen + Kevins Einnahmen fließen über Sync-Kette zu Jan

## Was entfällt
- Mirror-Kontakt Erstellung bei QR-Scan
- `localContactId` in pairs Tabelle
- `onQrScanned()` erstellt keinen Contact mehr
- Bestehender bidirektionaler Sync für Kontakte (wird asymmetrisch)

## Implementation Phasen

### Phase 1: Viewer-Zugang
- `pairs` Tabelle: `role` + `remoteContactId` Felder
- `remote_contacts` + `remote_transactions` Cache-Tabellen
- QR-Scan erstellt nur Pair (kein Mirror-Kontakt)
- Pairing-Request Rückkanal (Owner erstellt sein Pair)
- Owner → Viewer Sync (Contact + Transactions)
- Profil → Verlinkungen Seite (Read-Only View)

### Phase 2: Kurier
- Rolle-Upgrade (Viewer → Kurier) via Sync-Message
- Kurier-Dashboard (Inventar/Umsatz/Bonus, Manager-Kontakte aus Cache)
- Kurier erstellt Einnahmen → sync zu Manager
- Manager: Aufstocken/Abkassieren/Bonus → sync zu Kurier

### Phase 3: Sub-Kuriere + Multi-Manager
- Kurier zeigt eigenen QR im Owner-Modus
- Ketten-Sync: Sub-Kurier → Kurier → Manager
- Multi-Manager: Kurier-Dashboard mit Manager-Liste
