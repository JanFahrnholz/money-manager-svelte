# MoneyManager — Konzept & Architektur

> Single Source of Truth. Ersetzt alle vorherigen Specs.

## 1. Vision

MoneyManager ist eine local-first, privacy-preserving App zum Tracken von Geldbeziehungen. Du führst ein Buch: wer schuldet dir Geld, wem schuldest du, wer hat gezahlt, wer hat geliehen. Alle Daten leben auf deinem Gerät. Kein Server sieht jemals Klartext. Optional können Geräte per QR-Code verbunden werden für Transparenz (Viewer) oder Delegation (Agent). Ziel: PWA + native (iOS/Android), offline-first.

## 2. Kernprinzipien

- **Kontakt = Bucheintrag**, nicht Person. Ein Kontakt existiert nur in deinem Buch.
- **Negativer Kontostand = Kontakt schuldet dir Geld.** Positiv = du schuldest dem Kontakt.
- **Netzwerk = Container für Kontakte.** Jeder hat ein eigenes Netzwerk. Agents arbeiten in fremden Netzwerken.
- **Daten-Ownership**: Jeder ist Owner seiner eigenen Daten. Kein zentraler Server.
- **Verlinkung ist optional.** 90% der Nutzung funktioniert ohne Pairing.

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

### 3.3 Netzwerk
Container der Kontakte und Transaktionen gruppiert.
- Jeder User hat ein Standard-Netzwerk ("Mein Netzwerk")
- Agent-Netzwerke: Netzwerke anderer Manager in denen man als Agent arbeitet
- Kontakte gehören zu genau einem Netzwerk (Default: eigenes)
- Identifiziert durch `networkId` auf jedem Kontakt ("own" = eigenes, pair.id = Agent-Netzwerk)

### 3.4 Contact
Bucheintrag für eine Person mit der du Geld trackst.
- `name`, `balance`, `score`, `owner`, `networkId`
- `balance` = nur Kredit/Refund Effekte (Schulden-Buch)
- Kann Eigenschaften haben: verbunden (gepairt), Agent

### 3.5 Transaction
Geld-Bewegung zwischen dir und einem Kontakt.

| Typ | Deutsch | Wer erstellt | Kontakt-Balance | User-Balance | Agent-Effekt |
|-----|---------|-------------|-----------------|--------------|--------------|
| Income | Einnahme | Owner/Agent | keine Änderung | +Betrag | Inventar -, Umsatz +, Bonus + |
| Expense | Ausgabe | Owner | keine Änderung | -Betrag | — |
| Credit | Kredit | Owner | -Betrag | keine Änderung | — |
| Refund | Rückzahlung | Owner | +Betrag | +Betrag | — |
| Restock | Aufstocken | Manager | keine Änderung | keine Änderung | Inventar + |
| Collect | Abkassieren | Manager | keine Änderung | keine Änderung | Umsatz - |
| Redeem | Bonus einlösen | Manager | keine Änderung | keine Änderung | Bonus - |

Geplante Transaktionen (`planned = true`) haben keine Balance-Effekte bis sie bestätigt werden.

### 3.6 AgentLink (intern: CourierLink)
Manager→Agent Beziehung mit drei Kontoständen.
- `inventoryBalance`: Warenbestand zum Verkaufen
- `salesBalance`: Erlöse aus Verkäufen
- `bonusBalance`: Provision (% vom Umsatz)
- `bonusPercentage`: Provisionssatz

### 3.7 Pair
Verschlüsselte Verbindung zwischen zwei Geräten.
- `remoteDeviceId`, `remotePublicKey`, `sharedKey` (AES-256-GCM)
- `role`: `'viewer'` | `'agent'` | `''`
- `localContactId`: Kontakt auf Owner-Seite
- `remoteContactId`: Kontakt-ID auf dem anderen Gerät

## 4. Netzwerk-Modell

### Jeder hat sein eigenes Netzwerk
- Beim ersten Start: "Mein Netzwerk" wird automatisch erstellt
- Enthält alle eigenen Kontakte und Transaktionen
- Volle Kontrolle: erstellen, bearbeiten, löschen

### Agent-Netzwerke
- Wenn du als Agent für einen Manager arbeitest, erscheint dessen Netzwerk als separate Karte
- Du siehst die gecachten Kontakte des Managers
- Du kannst Einnahmen buchen die Inventar reduzieren und Umsatz erhöhen
- Jedes Agent-Netzwerk hat eigenes Inventar/Umsatz/Bonus

### Netzwerk-Verbindung
- Ein Agent verbindet sein Netzwerk mit dem des Managers
- Transaktionen in Agent-Kontakten fließen als Umsatz zum Manager
- Sub-Agents: Agent kann eigene Agents haben → Ketten-Forwarding

### Multi-Manager
- Ein User kann Agent in mehreren Netzwerken sein
- Jedes Netzwerk ist unabhängig (eigener Schlüssel, eigenes Inventar)
- Kontakte sind pro Netzwerk getrennt

## 5. Zwei Modi pro User

### "Mein Netzwerk" (Owner-Modus)
Standard. Du erstellst Kontakte, buchst Transaktionen, verwaltest Agents.

### "Agent-Netzwerke" (Agent-Modus)
Netzwerke anderer Manager. Du siehst gecachte Kontakte und buchst Einnahmen.

### "Bei mir verbunden" (Viewer-Modus)
Im Profil. Zeigt Personen die DICH in ihrem Buch verbunden haben.
- **Viewer**: Read-Only Sicht auf deine Daten im Buch des Owners
- **Agent**: Agent-Dashboard mit Inventar/Umsatz/Bonus

## 6. QR-Pairing

### Zwei Wege zum Verbinden

**Weg 1: Kontakt-QR (Shortcut)**
1. Owner öffnet Kontakt-Detail → "Verbinden" → QR zeigen
2. Partner scannt → Pair wird sofort dem Kontakt zugewiesen
3. QR enthält: `{ deviceId, publicKey, contactId, contactName, ownerName }`

**Weg 2: Profil-QR (Flexibel)**
1. Owner zeigt Geräte-QR im Profil (immer gleich)
2. Partner scannt → Geräte verbunden, kein Kontakt zugewiesen
3. Owner weist nachträglich zu: "Diese Verbindung gehört zu Kontakt X"

### Pairing-Ablauf
1. Gerät B scannt QR → erstellt Pair lokal
2. Gerät B sendet Pairing-Request an Relay
3. Gerät A pollt → findet Request → erstellt eigenes Pair
4. Beide Geräte haben denselben AES-256-GCM Schlüssel (via ECDH)
5. Verschlüsselter Sync startet

### Beförderung zum Agent
1. Kontakt muss erst verbunden sein (Pair existiert)
2. Owner: Kontakt-Detail → "Zum Agent machen" → Bonus-% eingeben
3. `role_upgrade` Sync-Message an Agent-Gerät
4. Manager sendet alle seine Kontakte als Cache an den Agent

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
- **Owner → Agent**: Kontakte, AgentLink-Updates (Inventar, Bonus-%)
- **Agent → Owner**: Income-Transaktionen, Balance-Updates
- **Chain Forwarding**: Sub-Agent → Agent → Manager (automatisch)

### Cache-Tabellen
Empfangene Daten landen in separaten Cache-Tabellen:
- `remote_contacts`: Gecachte Kontakte vom Manager (für Agent)
- `remote_transactions`: Gecachte Transaktionen

## 8. Agent-System

### Inventar-Flow
```
Manager stockt auf (Restock +500€)
    → Agent: inventoryBalance = 500€
Agent verkauft (Income 50€ bei Kontakt "Max")
    → inventoryBalance -50 = 450€
    → salesBalance +50 = 50€
    → bonusBalance +2.50 (5%)
Manager kassiert ab (Collect 50€)
    → salesBalance -50 = 0€
Manager löst Bonus ein (Redeem 2.50€)
    → bonusBalance -2.50 = 0€
```

### Multi-Level (Sub-Agents)
- Agent kann in seinem Owner-Modus eigene Agents einladen
- Kevin arbeitet für Dominik, Dominik arbeitet für Jan
- Kevins Transaktionen: Kevin → Dominik (Sync) → Jan (Chain Forwarding)

### Multi-Manager
- Ein Agent kann für mehrere Manager arbeiten
- Jeder Manager = separates Pair mit eigenem Inventar/Schlüssel
- Netzwerk-Tab: separate Karte pro Manager

## 9. UI-Struktur

### Tab-Bar
**Dashboard** | **Netzwerk** | **Profil**

### Netzwerk-Tab (vorher "Kontakte")
Zeigt eine **Liste von Netzwerk-Karten**:

| Karte | Inhalt |
|-------|--------|
| Mein Netzwerk | Kontaktanzahl, Forderungen, Schulden |
| Jans Netzwerk [Agent] | Kontaktanzahl, Inventar, Umsatz |
| Lisas Netzwerk [Agent] | Kontaktanzahl, Inventar |

- Tap auf Karte → öffnet Kontaktliste für dieses Netzwerk
- Neuer User sieht nur "Mein Netzwerk"
- QR-Scanner Button unten

### Kontaktliste (innerhalb eines Netzwerks)
- Suche + Filter
- Agent-Netzwerk zeigt Agent-Info Banner (Inventar/Umsatz/Bonus)
- "Einnahme buchen" Button in Agent-Netzwerken

### Kontakt-Detail
- Balance, Graph, Stats, Transaktionen
- Netzwerk-Zugehörigkeit angezeigt
- Agent-Kontakte: "Zum Agent machen" / Agent-Info wenn schon Agent
- "Verbinden" für QR-Pairing

### Dashboard
- Kontostand (global)
- Forderungen/Schulden (aus "Mein Netzwerk")
- Agent-Summary (falls Agent): Gesamt-Inventar, Gesamt-Umsatz
- Letzte Transaktionen (alle Netzwerke)
- Geplante Transaktionen

### Profil
- Username, Sprache, Sync-Status
- Geräte-QR + Geräte-ID
- Netzwerk-Übersicht (alle Netzwerke mit Rolle)
- Verlinkungen (wer sieht meine Daten)

### Seiten-Übersicht

| Route | Seite | Modus |
|-------|-------|-------|
| `/tabs/dashboard` | Dashboard | Owner |
| `/tabs/network` | Netzwerk-Liste (Karten) | Alle |
| `/tabs/network/:networkId` | Kontaktliste im Netzwerk | Owner/Agent |
| `/tabs/network/:networkId/:contactId` | Kontakt-Detail | Owner/Agent |
| `/tabs/transactions/create` | Transaktion erstellen | Owner/Agent |
| `/tabs/transactions/planned` | Geplante Transaktionen | Owner |
| `/tabs/profile` | Profil | Alle |
| `/tabs/profile/linkages` | Verlinkungen | Viewer |
| `/tabs/profile/linkages/:pairId` | Verlinkung-Detail | Viewer |

### Shared Components
- TimeframeSelector (1W/1M/Monat/3M/6M/1J/Max)
- Numpad (Betrags-Eingabe)
- BalanceGraph (SVG Step-Graph mit Hover-Tooltips + Null-Linie)
- StatsCards (2x2 Grid: Einnahme/Ausgabe/Kredit/Score)
- QrDisplay + QrScanner

## 10. Zukunft

### Phase 3: Produkte & Bestellungen
- Produkt-Katalog (Name, Preis, Bestand, Einheit)
- Order-Workflow: open → accepted → packaged → delivered
- Gelieferte Order → automatische Transaktion
- Agents sehen Produktkatalog des Managers

### Phase 4: Chat
- Nachrichten zwischen verbundenen Geräten
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
