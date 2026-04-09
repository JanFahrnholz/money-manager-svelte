# MoneyManager — Konzept-Redesign & Erweiterungen

> Ersetzt und erweitert CONCEPT.md. Ergebnis des Brainstormings vom 2026-04-09.

## Context

Das bestehende CONCEPT.md definiert die App-Architektur mit Netzwerk-Karten, 3-Balance Agent-System und PocketBase als Relay. Drei Kernbereiche wurden als problematisch identifiziert:

1. **Netzwerk-Metapher**: "Mein Netzwerk" vs "Agent-Netzwerke" als gleichwertige Karten verwischt die Grenze zwischen eigenen und fremden Daten.
2. **Agent-System**: Das 3-Balance-Modell (Inventar/Umsatz/Bonus) unterstützt nur Kommission, nicht Vorab-Kauf. Keine Posten-granulare Zuordnung.
3. **Relay**: PocketBase als Relay ist zu schwergewichtig. User sollen eigene Relays hosten können.

Dieses Redesign adressiert alle drei Bereiche und definiert die Erweiterungen für zukünftige Phasen.

## 1. Vision

MoneyManager ist eine **local-first, privacy-preserving App** zum Tracken von Geldbeziehungen. Du führst ein Buch: wer schuldet dir Geld, wem schuldest du, wer hat gezahlt, wer hat geliehen.

**Kernprinzipien:**
- Alle Daten leben auf deinem Gerät (SQLite + SQLCipher)
- Kein Server sieht jemals Klartext
- Sync läuft über einen **selbst-hostbaren Relay-Server** — ein minimaler Service den jeder betreiben kann
- Geräte verbinden sich per QR-Code für Transparenz (Viewer) oder Delegation (Agent)
- Signal-Level Verschlüsselung (X25519 + Double Ratchet + AES-256-GCM)
- PWA + native (iOS/Android), offline-first

**Was sich gegenüber CONCEPT.md ändert:**
- Kein PocketBase als Relay → eigener minimaler Relay-Server
- Posten-basiertes Agent-System statt globaler Balances
- Dashboard-Hub statt Netzwerk-Karten
- X25519 + Double Ratchet statt statische ECDH P-256

## 2. Kernprinzipien

- **Kontakt = Bucheintrag**, nicht Person. Ein Kontakt existiert nur in deinem Buch.
- **Negativer Kontostand = Kontakt schuldet dir Geld.** Positiv = du schuldest dem Kontakt.
- **Dein Buch = dein Kontakte-Tab.** Immer nur eigene Daten. Nie gemischt mit Fremddaten.
- **Agent-Arbeit = separate Welt.** Erreichbar über Dashboard-Karten, aber klar getrennt.
- **Daten-Ownership**: Jeder ist Owner seiner eigenen Daten. Kein zentraler Server.
- **Verlinkung ist optional.** 90% der Nutzung funktioniert ohne Pairing.

## 3. UI-Architektur (Hybrid-Modell)

### Tab-Bar: Dashboard | Kontakte | Profil (immer 3 Tabs)

### Dashboard (Hub)
- Kontostand (global)
- Forderungen/Schulden (aus eigenem Buch)
- **Agent-Karten** (nur sichtbar wenn Agent): pro Manager eine Karte mit aggregiertem Inventar/Umsatz/Bonus → Tap öffnet Agent-Dashboard als Pushed Page
- Letzte Transaktionen (alle Kontexte)
- Geplante Transaktionen

### Kontakte-Tab
- Immer NUR eigenes Buch
- Suche, Filter, Balances, Scores
- Kontakt-Detail: Balance, Graph, Stats, Transaktionshistorie
- Kontakt-Detail: "Verlinken" (QR), "Zum Agent machen"
- Kein Agent-Zeug, keine Fremddaten

### Profil
- Username, Sprache
- Relay-Server URL (konfigurierbar)
- Geräte-QR + Geräte-ID
- **Verlinkungen**: Liste aller Pairs (Viewer + Agent) mit Rolle
  - Viewer: Tap → Read-Only Ansicht (Balance + Transaktionen aus Cache)
  - Agent: Tap → Agent-Dashboard (identisch mit Dashboard-Karte-Tap)
- Sicherheit: PIN/Biometrie-Einstellungen
- Export/Backup

### Agent-Dashboard (Pushed Page)
- Navigation: "< Dashboard" / "< Profil" (je nach Einstieg)
- Header: "Agent bei [Manager-Name]"
- Inventar/Umsatz/Bonus Übersicht (aggregiert aus Posten)
- Posten-Liste: offene Chargen mit Restbestand und Typ (Kommission/Vorab)
- Kontakte des Managers (aus remote_contacts Cache)
- FAB: "+ Einnahme buchen"
- Kontakt-Detail: Balance + Transaktionshistorie (Read-Only) + "Einnahme buchen" Button

### Warum dieses Modell
- **Normale User (80%):** Sehen nur Dashboard + Kontakte + Profil. Kein Agent-Noise.
- **Agents:** Dashboard-Karte = 1 Tap zum Agent-Dashboard. Schnell erreichbar.
- **Multi-Manager:** Mehrere Karten auf dem Dashboard. Skaliert beliebig.
- **Organisches Wachstum:** Wird jemand Agent, erscheint eine Karte. Kein abrupter UI-Wechsel.

## 4. Core Entities

### 4.1 Device
Geräte-Identität, generiert beim ersten App-Start.
- `id`: 15-Zeichen random String
- `publicKey`: X25519 (JWK)
- `privateKey`: X25519 (JWK, verlässt nie das Gerät, geschützt durch SQLCipher)

### 4.2 User (lokal)
Lokaler App-Account, kein Server-Account.
- `id`, `username`, `balance`, `settings`, `language`
- `balance` = Summe aller Income - Expense + Refund

### 4.3 Contact
Bucheintrag für eine Person mit der du Geld trackst.
- `name`, `balance`, `score`, `owner`
- `balance` = nur Credit/Refund Effekte (Schulden-Buch)
- Optional: verlinkt (Pair existiert), Agent (AgentLink existiert)

### 4.4 Transaction
Geld-Bewegung zwischen dir und einem Kontakt.

| Typ | Deutsch | Wer erstellt | Kontakt-Balance | User-Balance | Agent-Effekt |
|-----|---------|-------------|-----------------|--------------|--------------|
| Income | Einnahme | Owner/Agent | keine Änderung | +Betrag | Posten: remaining -. Bei commission: salesTotal +, bonusTotal +. Bei prepaid: keine weiteren Effekte. |
| Expense | Ausgabe | Owner | keine Änderung | -Betrag | — |
| Credit | Kredit | Owner | -Betrag | keine Änderung | — |
| Refund | Rückzahlung | Owner | +Betrag | +Betrag | — |
| Restock | Aufstocken | Manager | keine Änderung | keine Änderung | Neuer Posten erstellt |
| Collect | Abkassieren | Manager | keine Änderung | keine Änderung | Posten: collected + |
| Redeem | Bonus einlösen | Manager | keine Änderung | keine Änderung | Posten: redeemed + |

Geplante Transaktionen (`planned = true`) haben keine Balance-Effekte bis sie bestätigt werden.

### 4.5 AgentLink (ersetzt CourierLink)
Manager→Agent Beziehung.
- `id`, `contactId`, `pairId`, `totalSales`, `created`
- Balances werden aus Posten aggregiert (nicht mehr direkt gespeichert)

### 4.6 Batch (Posten) — NEU
Einzelne Charge Inventar vom Manager an den Agent.
- `id`, `agentLinkId`
- `type`: "commission" | "prepaid"
- `amount`: Ursprünglicher Betrag
- `remaining`: Restbestand
- `bonusPercentage`: Provisionssatz (0% bei prepaid)
- `salesTotal`: Summe der Verkäufe aus diesem Posten
- `bonusTotal`: Summe der Provision aus diesem Posten
- `collected`: Vom Manager abkassierter Betrag
- `redeemed`: Ausgezahlte Provision
- `created`

### 4.7 Pair
Verschlüsselte Verbindung zwischen zwei Geräten.
- `id`, `remoteDeviceId`, `remotePublicKey`
- `rootKey`: Double Ratchet Root Key
- `sendChainKey`, `receiveChainKey`: KDF Chain Keys
- `role`: "viewer" | "agent" | "linked" (linked = Geräte verbunden aber noch keinem Kontakt zugewiesen, z.B. nach Profil-QR)
- `remoteContactId`: Kontakt-ID auf Owner-Gerät
- `label`: Name des Partners
- `relayUrl`: Relay-Server für dieses Pair

## 5. Agent-System (Posten-basiert)

### Kommission-Flow
```
Manager erstellt Restock (500€, commission, 5% Bonus)
    → Neuer Posten: amount=500, remaining=500, type=commission, bonus=5%

Agent verkauft (50€ an Kontakt "Max")
    → Posten: remaining -50 = 450, salesTotal +50, bonusTotal +2.50

Manager kassiert ab (Collect 50€ auf diesem Posten)
    → Posten: collected +50

Manager zahlt Bonus aus (Redeem 2.50€ auf diesem Posten)
    → Posten: redeemed +2.50
```

### Vorab-Kauf-Flow
```
Agent zahlt Manager 500€ (normale Income-Transaktion im Buch)
Manager erstellt Restock (500€, prepaid, 0% Bonus)
    → Neuer Posten: amount=500, remaining=500, type=prepaid, bonus=0%

Agent verkauft (60€ an Kontakt "Max" — eigener Preis)
    → Posten: remaining -60 = 440 (kein salesTotal/bonusTotal bei prepaid)

Kein Collect nötig (Agent hat vorab bezahlt)
```

### Gemischtes Inventar
Ein Agent kann gleichzeitig Kommissions-Posten und Vorab-Posten haben. Beim Verkauf:
- Agent wählt den Posten aus dem er verkauft (UI: Posten-Auswahl)
- Default: FIFO global über alle Posten (ältester zuerst, unabhängig vom Typ)
- Wenn nur ein Posten offen ist, wird dieser automatisch gewählt (kein UI nötig)

### Sub-Agent-Ketten
```
Jan (Manager) erstellt Posten: 1000€ Kommission, 5% Bonus
    → Restock an Dominik: 500€ aus diesem Posten

Dominik (Agent von Jan, Manager von Kevin)
    → Empfängt Posten: 500€ Kommission, 5% Bonus
    → Erstellt Sub-Posten: 200€ an Kevin, 3% Bonus

Kevin (Sub-Agent) verkauft 50€
    → Kevins Posten: remaining -50, salesTotal +50, bonusTotal +1.50
    → Sync zu Dominik: Transaktion wird gemeldet, Dominiks Sub-Posten tracking aktualisiert
    → Chain-Forward zu Jan: Transaktion wird als Verkauf in Dominiks Posten sichtbar
```

### Aggregierte Anzeige
Das Agent-Dashboard zeigt aggregierte Werte:
- **Inventar** = Summe aller `remaining` über alle Posten
- **Umsatz** = Summe aller `salesTotal - collected` (offener Umsatz)
- **Bonus** = Summe aller `bonusTotal - redeemed` (offener Bonus)

Detailansicht: Liste der einzelnen Posten mit jeweiligem Status.

## 6. Sicherheitsarchitektur (Signal-Level)

### Crypto-Stack
- **Key Exchange**: X25519 (Curve25519) via Web Crypto API
- **Symmetric Encryption**: AES-256-GCM (12-byte IV, einzigartig pro Nachricht)
- **Key Derivation**: HKDF-SHA256 via Web Crypto API
- **Forward Secrecy**: Double Ratchet Protocol
  - Jede Nachricht nutzt einen neuen Message Key
  - Abgeleitet aus Chain Key (KDF Chain)
  - DH-Ratchet-Schritt bei Richtungswechsel (neues Ephemeral Key Pair)
  - Kompromiss eines Keys = nur 1 Nachricht exponiert
- **Kein npm Crypto** — nur Web Crypto API native

### Lokale Sicherheit
- **SQLCipher**: SQLite-DB komplett verschlüsselt
- **PIN / Biometrie**: App-Sperre, Crypto-Keys erst nach Auth freigegeben
- **Private Keys**: Verlassen nie das Gerät, geschützt durch SQLCipher + PIN

### Pairing-Ablauf
1. Owner zeigt QR mit: `{ deviceId, publicKey (X25519), contactId?, contactName?, ownerName }`
2. Partner scannt → berechnet Shared Secret via X25519
3. HKDF leitet Root Key ab
4. Double Ratchet initialisiert (Send/Receive Chain Keys)
5. Partner sendet Pairing-Request an Relay (verschlüsselt mit Root Key)
6. Owner pollt → findet Request → initialisiert eigenen Ratchet
7. Verschlüsselter Sync startet

## 7. Relay-Server (self-hosted)

### Design
Minimaler HTTP-Service (~50-100 Zeilen Go oder Deno):
```
PUT  /messages          → Blob speichern (pairId, sender, payload, created)
GET  /messages?pair=X   → Blobs für ein Pair abholen
DELETE /messages/:id    → Nach Empfang löschen
```

### Eigenschaften
- Kein Auth, keine Accounts — Sicherheit kommt aus Verschlüsselung
- Messages haben TTL (default: 7 Tage, konfigurierbar)
- Rate-Limiting gegen Spam
- CORS-Headers für Web-PWA-Zugang
- Docker-Image für einfaches Self-Hosting
- 1-Klick Deploy auf Railway, Fly.io, Render, etc.

### App-Konfiguration
- Relay-URL konfigurierbar unter Profil → Einstellungen
- Default: öffentlicher Community-Relay (vom Projekt betrieben)
- Pro Pair kann eine eigene Relay-URL gesetzt werden
- Pair-Daten enthalten `relayUrl` Feld

### Was der Relay sieht
- `pairId` (random, nicht zuordenbar)
- Verschlüsselter Blob (AES-256-GCM)
- Timestamp
- Sender Device ID
- Sonst nichts. Keine Metadaten über Inhalte, Kontakte oder Beträge.

## 8. Sync-Protokoll

### Nachrichten-Format
```json
{
  "pairId": "...",
  "sender": "device_abc",
  "payload": "<Double Ratchet encrypted, base64>",
  "created": "2026-04-09T10:30:00Z"
}
```

### Entschlüsselter Payload (Beispiele)
```json
{ "type": "sync", "table": "contacts", "action": "upsert", "data": {...} }
{ "type": "sync", "table": "transactions", "action": "upsert", "data": {...} }
{ "type": "sync", "table": "batches", "action": "upsert", "data": {...} }
{ "type": "role_upgrade", "newRole": "agent", "agentLinkData": { "bonusPercentage": 5 } }
{ "type": "ratchet_step", "publicKey": "<new ephemeral X25519 key>" }
```

### Sync-Richtungen
- **Owner → Viewer**: Kontakt-Daten + Transaktionen (Read-Only Push)
- **Owner → Agent**: Kontakte, Posten-Updates (neue Chargen, Inventar-Änderungen)
- **Agent → Owner**: Income-Transaktionen, Posten-Balance-Updates
- **Chain Forward**: Sub-Agent → Agent → Manager (automatisch bei jedem Sync)

### Cache-Tabellen (auf Agent/Viewer-Seite)
```sql
remote_contacts (id, pairId, name, balance, score, created, updated)
remote_transactions (id, pairId, contactId, amount, type, date, info, created, updated)
remote_batches (id, pairId, agentLinkId, type, amount, remaining, bonusPercentage, ...)
```

## 9. Rollen-Übersicht

| Rolle | Perspektive | Sieht | Kann |
|-------|-------------|-------|------|
| **Owner** | Kontakte-Tab | Alle eigenen Kontakte, Transaktionen | Alles: CRUD Kontakte, Transaktionen, Agents verwalten |
| **Viewer** | Profil → Verlinkungen | Eigenen Kontostand + Transaktionen beim Owner (cached, Read-Only) | Nichts ändern |
| **Agent** | Dashboard-Karte + Profil → Verlinkungen | Inventar/Umsatz/Bonus, Manager-Kontakte (cached), eigene Posten | Einnahmen buchen (reduziert Posten-Bestand) |

## 10. Tech Stack

- **Frontend**: Angular 20 + Ionic 8 + Capacitor 7
- **Datenbank**: SQLite (via @capacitor-community/sqlite) + SQLCipher
- **Relay**: Eigener minimaler Server (Go oder Deno), Docker-Image
- **Crypto**: Web Crypto API (X25519, AES-256-GCM, HKDF-SHA256)
- **Forward Secrecy**: Double Ratchet Protocol (Eigenimplementierung auf Web Crypto)
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
- Agent-Karten: Gold-Gradient Border
- iOS Theme erzwungen

## 11. Roadmap

### Phase 1: Core (in Arbeit)
- Dashboard, Kontakte, Transaktionen, Profil
- Lokale SQLite-DB, offline-first
- Basis-Transaktionstypen (Income, Expense, Credit, Refund)
- Geplante Transaktionen
- i18n (DE/EN)

### Phase 2: Pairing & Viewer
- QR-Pairing mit X25519 Key Exchange
- Double Ratchet Protocol implementieren
- Minimaler Relay-Server + Docker-Image
- Relay-URL konfigurierbar in App-Einstellungen
- Viewer-Zugang (Read-Only Pair)
- Remote-Cache-Tabellen
- Profil → Verlinkungen Seite

### Phase 3: Agent-System
- Posten-basiertes Inventar (batches Tabelle)
- Agent-Beförderung (Viewer → Agent via role_upgrade)
- Agent-Dashboard als Pushed Page auf Dashboard
- Kommission + Vorab-Kauf Restocks
- Collect / Redeem pro Posten
- Sub-Agent-Ketten mit Chain-Forwarding

### Phase 4: Sicherheit & UX
- PIN / Biometrie App-Sperre
- SQLCipher DB-Verschlüsselung
- Export/Backup (verschlüsselt)
- Push Notifications (optional, via Relay)
- Multi-Device per User

### Phase 5: Produkte & Bestellungen
- Produktkatalog pro Manager
- Order-Workflow (open → accepted → packaged → delivered)
- Gelieferte Order → automatische Transaktion
- Agents sehen Produktkatalog

### Phase 6: Chat
- Verschlüsselte Nachrichten zwischen Pairs
- Verknüpft mit Bestellungen (ein Chat pro Order)
- Über denselben Relay + Double Ratchet

### Deferred
- Forward Secrecy Upgrades (Post-Quantum Crypto wenn Web Crypto unterstützt)
- Remote Pairing via Link (statt QR)
- Offline-Queue Optimierungen
- Multi-Language (über DE/EN hinaus)
