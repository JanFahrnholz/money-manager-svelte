# MoneyManager — Konzept & Architektur

> Single Source of Truth. Ersetzt alle vorherigen Specs.

## 1. Vision

MoneyManager ist eine local-first, privacy-preserving App zum Tracken von Geldbeziehungen. Du führst ein Buch: wer schuldet dir Geld, wem schuldest du, wer hat gezahlt, wer hat geliehen. Alle Daten leben auf deinem Gerät. Kein Server sieht jemals Klartext. Optional können Geräte per QR-Code verlinkt werden für Transparenz (Viewer) oder Delegation (Kurier). Ziel: PWA + native (iOS/Android), offline-first.

## 2. Kernprinzipien

- **Kontakt = Bucheintrag**, nicht Person. Ein Kontakt existiert nur in deinem Buch.
- **Negativer Kontostand = Kontakt schuldet dir Geld.** Positiv = du schuldest dem Kontakt.
- **Daten-Ownership**: Jeder ist Owner seiner eigenen Daten. Kein zentraler Server.
- **Verlinkung ist optional.** 90% der Nutzung funktioniert ohne Pairing.
- **Alles ist ein Kontakt.** Kurier, Viewer, Freund — alles sind Kontakte mit verschiedenen Eigenschaften.

## 3. Core Entities

### 3.1 Device
Geräte-Identität, generiert beim ersten App-Start.
- `id`: 15-Zeichen random String
- `publicKey`: ECDH P-256 (JWK)
- `privateKey`: ECDH P-256 (JWK, verlässt nie das Gerät)

### 3.2 User (lokal)
Lokaler App-Account, kein Server-Account.
- `id`, `username`, `balance`, `settings`, `language`
- `balance` = Summe aller Income - Expense + Refund

### 3.3 Contact
Bucheintrag für eine Person mit der du Geld trackst.
- `name`, `balance`, `score`, `owner` (immer lokaler User)
- `user` (deviceId des gepaarten Geräts, leer wenn nicht verlinkt)
- `balance` = nur Invoice/Refund Effekte (Schulden-Buch)
- Kann Eigenschaften haben: verlinkt, Kurier

### 3.4 Transaction
Geld-Bewegung zwischen dir und einem Kontakt.

| Typ | Deutsch | Wer erstellt | Kontakt-Balance | User-Balance | Kurier-Effekt |
|-----|---------|-------------|-----------------|--------------|---------------|
| Income | Einnahme | Owner/Kurier | keine Änderung | +Betrag | Inventar -, Umsatz +, Bonus + |
| Expense | Ausgabe | Owner | keine Änderung | -Betrag | — |
| Invoice | Rechnung | Owner | -Betrag | keine Änderung | — |
| Refund | Rückzahlung | Owner | +Betrag | +Betrag | — |
| Restock | Aufstocken | Manager | keine Änderung | keine Änderung | Inventar + |
| Collect | Abkassieren | Manager | keine Änderung | keine Änderung | Umsatz - |
| Redeem | Bonus einlösen | Manager | keine Änderung | keine Änderung | Bonus - |

Geplante Transaktionen (`planned = true`) haben keine Balance-Effekte bis sie bestätigt werden.

### 3.5 CourierLink
Manager→Kurier Beziehung mit drei Kontoständen.
- `inventoryBalance`: Warenbestand zum Verkaufen
- `salesBalance`: Erlöse aus Verkäufen
- `bonusBalance`: Provision (% vom Umsatz)
- `bonusPercentage`: Provisionssatz

### 3.6 Pair
Verschlüsselte Verbindung zwischen zwei Geräten.
- `remoteDeviceId`, `remotePublicKey`, `sharedKey` (AES-256-GCM)
- `role`: `'viewer'` | `'courier'` | `''`
- `localContactId`: Kontakt auf Owner-Seite (leer auf Viewer-Seite)
- `remoteContactId`: Kontakt-ID auf dem anderen Gerät

## 4. Zwei Modi pro User

### "Mein Buch" (Owner-Modus)
Standard. Du erstellst Kontakte, buchst Transaktionen, verwaltest Kuriere.
- **Tab: Dashboard** — Kontostand, Forderungen/Schulden, letzte Transaktionen
- **Tab: Kontakte** — Alle Kontakte mit Filter (Alle/Eigene/Verlinkt/Kuriere)
- **Tab: Profil** — Einstellungen, Geräte-ID, "Bei mir verlinkt"

### "Bei mir verlinkt" (Verlinkt-Modus)
Kleiner Bereich im Profil. Zeigt Personen die DICH in ihrem Buch verlinkt haben.
- **Viewer**: Read-Only Sicht auf deine Daten im Buch des Owners
- **Kurier**: Kurier-Dashboard mit Inventar/Umsatz/Bonus + Kontakte zum Verkaufen

## 5. Kontakt-Eigenschaften

Ein Kontakt ist immer ein Bucheintrag. Optional hat er zusätzliche Eigenschaften:

| Eigenschaft | Bedeutung | Aktivierung |
|-------------|-----------|------------|
| Basis | Balance + Transaktionen | Immer (jeder Kontakt) |
| Verlinkt | Gerät gepairt, Person hat die App | QR-Pairing |
| Kurier | Darf Einnahmen buchen, hat Inventar/Umsatz/Bonus | Owner befördert nach Pairing |

Kontakt-Detail zeigt alles an einem Ort:
- Balance, Graph, Stats, Transaktionen (immer)
- "Verlinkt ✓" Badge + Pair-Info (wenn verlinkt)
- Kurier-Bereich: Inventar/Umsatz/Bonus + Aktionen (wenn Kurier)

## 6. QR-Pairing

### Zwei Wege zum Pairen

**Weg 1: Kontakt-QR (Shortcut)**
1. Owner öffnet Kontakt-Detail → "Verlinken" → QR zeigen
2. Partner scannt → Pair wird sofort dem Kontakt zugewiesen
3. QR enthält: `{ deviceId, publicKey, contactId, contactName, ownerName }`

**Weg 2: Profil-QR (Flexibel)**
1. Owner zeigt Geräte-QR im Profil (immer gleich)
2. Partner scannt → Geräte gepairt, aber kein Kontakt zugewiesen
3. Owner weist nachträglich zu: "Diese Verlinkung gehört zu Kontakt X"
4. QR enthält: `{ deviceId, publicKey, ownerName }`

### Pairing-Ablauf
1. Gerät B scannt QR → erstellt Pair lokal
2. Gerät B sendet Pairing-Request an Relay (unverschlüsselt: Public Key + Contact Info)
3. Gerät A pollt → findet Request → erstellt eigenes Pair
4. Beide Geräte haben jetzt denselben AES-256-GCM Schlüssel (via ECDH)
5. Verschlüsselter Sync startet

### Beförderung zum Kurier
1. Kontakt muss erst verlinkt sein (Pair existiert)
2. Owner: Kontakt-Detail → "Zum Kurier machen" → Bonus-% eingeben
3. `role_upgrade` Sync-Message an Kurier-Gerät
4. Manager sendet alle seine Kontakte als Cache an den Kurier

## 7. Verschlüsselung & Sync

### Crypto
- ECDH P-256 für Key Exchange (Web Crypto API)
- AES-256-GCM für Verschlüsselung (12-byte IV pro Nachricht)
- Kein npm Crypto — nur Browser-native APIs

### Relay (PocketBase)
- Eine Collection: `sync_messages` (pairId, sender, payload)
- Alles öffentlich (kein Auth) — Sicherheit kommt von der Verschlüsselung
- Messages werden nach Verarbeitung gelöscht

### Sync-Richtungen
- **Owner → Viewer**: Kontakt-Daten + Transaktionen (Read-Only Push)
- **Owner → Kurier**: Kontakte, CourierLink-Updates (Inventar, Bonus-%)
- **Kurier → Owner**: Income-Transaktionen, Balance-Updates
- **Chain Forwarding**: Sub-Kurier → Kurier → Manager (automatisch)

### Cache-Tabellen
Empfangene Daten landen in separaten Cache-Tabellen:
- `remote_contacts`: Gecachte Kontakte vom Manager (für Kurier)
- `remote_transactions`: Gecachte Transaktionen

## 8. Kurier-System

### Inventar-Flow
```
Manager stockt auf (Restock +500€)
    → Kurier: inventoryBalance = 500€
Kurier verkauft (Income 50€ bei Kontakt "Max")
    → inventoryBalance -50 = 450€
    → salesBalance +50 = 50€
    → bonusBalance +2.50 (5%)
Manager kassiert ab (Collect 50€)
    → salesBalance -50 = 0€
Manager löst Bonus ein (Redeem 2.50€)
    → bonusBalance -2.50 = 0€
```

### Multi-Level (Sub-Kuriere)
- Kurier kann in seinem Owner-Modus eigene Kuriere einladen
- Kevin arbeitet für Dominik, Dominik arbeitet für Jan
- Kevins Transaktionen: Kevin → Dominik (Sync) → Jan (Chain Forwarding)

### Multi-Manager
- Ein Kurier kann für mehrere Manager arbeiten
- Jeder Manager = separates Pair mit eigenem Inventar/Schlüssel
- Kurier-Dashboard: Liste der Manager

## 9. UI-Struktur

### Tab-Bar
Dashboard | Kontakte | Profil

### Seiten

| Route | Seite | Modus |
|-------|-------|-------|
| `/tabs/dashboard` | Dashboard | Owner |
| `/tabs/contacts` | Kontaktliste (Filter: Alle/Eigene/Verlinkt/Kuriere) | Owner |
| `/tabs/contacts/:id` | Kontakt-Detail (Balance, Graph, Stats, Tx, Kurier-Bereich) | Owner |
| `/tabs/transactions/create` | Transaktion erstellen (Numpad) | Owner/Kurier |
| `/tabs/transactions/planned` | Geplante Transaktionen | Owner |
| `/tabs/profile` | Profil + "Bei mir verlinkt" | Beide |
| `/tabs/profile/linkages` | Verlinkungen-Liste (Pairs) | Verlinkt |
| `/tabs/profile/linkages/:id` | Verlinkung-Detail (Read-Only oder Kurier) | Verlinkt |
| `/tabs/profile/courier-dashboard` | Kurier-Dashboard (Inventar, Manager-Kontakte) | Kurier |

### Shared Components
- TimeframeSelector (1W/1M/Monat/3M/6M/1J/Max)
- Numpad (Betrags-Eingabe)
- BalanceGraph (SVG Step-Graph mit Hover-Tooltips + Null-Linie)
- StatsCards (2x2 Grid: Einnahme/Ausgabe/Rechnung/Score)
- QrDisplay + QrScanner

## 10. Zukunft

### Phase 3: Produkte & Bestellungen
- Produkt-Katalog (Name, Preis, Bestand, Einheit)
- Order-Workflow: open → accepted → packaged → delivered
- Gelieferte Order → automatische Transaktion
- Kuriere sehen Produktkatalog des Managers

### Phase 4: Chat
- Nachrichten zwischen verlinkten Geräten
- Verknüpft mit Bestellungen (ein Chat pro Order)
- Über den gleichen verschlüsselten Relay

### Deferred
- App PIN / Biometrische Sperre
- Forward Secrecy (aktuell statische ECDH Keys)
- Remote Pairing via Link (statt QR)
- Offline-Queue für Sync-Events
- Export/Backup der lokalen Daten
- Push-Notifications
- Multi-Device per User

## 11. Tech Stack

- **Frontend**: Angular 20 + Ionic 8 + Capacitor 7
- **Datenbank**: SQLite (via @capacitor-community/sqlite + jeep-sqlite/sql.js)
- **Sync**: PocketBase (Relay, kein Auth)
- **Crypto**: Web Crypto API (ECDH P-256, AES-256-GCM)
- **i18n**: ngx-translate (DE/EN)
- **QR**: qrcode + html5-qrcode
- **State**: Angular Signals (kein RxJS/NgRx)
- **Architektur**: Standalone Components, Feature-basierte Ordnerstruktur, Lazy-Loading

### Design Language
- Dark Mode Default (#1a1a1a)
- Primary: #ffd600 (Gold)
- Positive: #4cd964 (Grün)
- Negative: #ff3b30 (Rot)
- Warning: #ff9500 (Orange)
- iOS Theme erzwungen
