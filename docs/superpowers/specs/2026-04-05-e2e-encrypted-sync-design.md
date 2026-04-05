# E2E Encrypted Sync — Design Spec

## Context

MoneyManager app2 is a local-first Ionic/Angular app. All user data lives in SQLite on the device. No user accounts exist on any server. When two users want to share data (e.g., Manager links a contact with a Courier), they pair their devices via QR code and establish an encrypted sync channel. A PocketBase relay server stores only encrypted blobs — it cannot read any data.

## Crypto Architecture

### Device Identity

On first app launch, each device generates:
- **ECDH P-256 Keypair** via Web Crypto API (built-in, no npm dependency)
- **deviceId**: 15-character random string (same format as PocketBase IDs)
- Stored in SQLite table `device` (exactly 1 row)

### QR Code Pairing Flow

Pairing happens per **contact link**, not globally between devices.

1. User A has contact "Max" and wants to link it with the real Max on Device B
2. User A opens contact detail → "Verlinken" → app shows QR code:
   ```json
   { "deviceId": "abc123", "publicKey": { JWK }, "contactId": "xyz789", "contactName": "Max" }
   ```
3. User B (Max) scans QR code with their app
4. Device B derives shared secret: `ECDH(B.privateKey, A.publicKey)` → `deriveKey(AES-256-GCM)`
5. Device B creates a mirror contact (linked to A) on its local SQLite
6. Device B sends its public key + mirror contact info as first encrypted sync message
7. Device A polls relay, decrypts B's public key, derives the same shared secret
8. Pairing complete — both sides have the same AES-256-GCM key

### Encryption

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key derivation:** ECDH P-256 → HKDF-SHA256 → AES-256 key
- **Per-message:** Random 12-byte IV, prepended to ciphertext
- **Payload format:** `base64(IV[12] + ciphertext + authTag[16])`
- **Library:** Web Crypto API only (no npm crypto packages)

## Data Model

### New SQLite Tables

**device** (exactly 1 row):
```sql
CREATE TABLE device (
  id TEXT PRIMARY KEY,          -- deviceId (15 chars)
  publicKey TEXT NOT NULL,      -- JWK JSON string
  privateKey TEXT NOT NULL,     -- JWK JSON string (never leaves device)
  created TEXT NOT NULL
);
```

**pairs** (one row per linked contact):
```sql
CREATE TABLE pairs (
  id TEXT PRIMARY KEY,
  localContactId TEXT NOT NULL, -- my contact that is linked
  remoteDeviceId TEXT NOT NULL, -- partner's deviceId
  remotePublicKey TEXT NOT NULL,-- partner's public key (JWK)
  sharedKey TEXT NOT NULL,      -- derived AES key (base64 raw bytes)
  label TEXT DEFAULT '',        -- partner's display name
  created TEXT NOT NULL,
  FOREIGN KEY (localContactId) REFERENCES contacts(id)
);
```

### PocketBase Relay Collection

**sync_messages** (no auth rules — public read/write):

| Field | Type | Description |
|---|---|---|
| pairId | text, required | SHA-256 hash of sorted deviceIds, identifies the pair |
| sender | text, required | deviceId of the sender |
| payload | text, required | base64(IV + AES-GCM ciphertext) |
| created | autodate | Timestamp |

No other PocketBase collections are used. No auth. No user data in cleartext.

## Sync Protocol

### What Gets Synced Per Pair

A pair links one local contact with one remote device. Synced data for that pair:
- The linked **contact** record (name, balance, linkedName)
- All **transactions** on that contact
- If the contact has a **courier_link**: the courier_link record
- All **courier transactions** (Restock/Collect/Redeem) on that courier_link

### SyncEvent Format

When a local change affects a shared record:
```json
{
  "action": "upsert" | "delete",
  "table": "contacts" | "transactions" | "courier_links",
  "recordId": "abc123",
  "data": { ... full record ... },
  "timestamp": "2026-04-05T10:00:00.000Z"
}
```

### Sync Flow

**Outbound (local change → relay):**
1. Service modifies SQLite record
2. Service checks: is this record associated with a pair?
   - Contact: does it have a pair where `localContactId = this contact`?
   - Transaction: does its contact have a pair?
   - CourierLink: does the linked contact have a pair?
3. If yes: create SyncEvent, encrypt with pair's sharedKey, POST to relay
4. Multiple pairs possible (same contact linked multiple times = edge case, but supported)

**Inbound (relay → local):**
1. Periodically (every 30s) or on app open: for each pair, poll relay for new messages
2. Filter: `pairId = hash(myDeviceId, pair.remoteDeviceId) && sender != myDeviceId`
3. Decrypt each message with pair's sharedKey
4. Parse SyncEvent, apply to local SQLite (upsert or delete)
5. Delete processed message from relay

**Conflict resolution:** Last-write-wins based on `timestamp` in the SyncEvent. If incoming timestamp > local `updated`, apply. Otherwise discard.

## Services Architecture

### `core/services/crypto.service.ts`
- `generateKeyPair()`: returns `{ publicKey: JWK, privateKey: JWK }`
- `deriveSharedKey(myPrivateKey: JWK, theirPublicKey: JWK)`: returns AES-256-GCM CryptoKey
- `encrypt(key: CryptoKey, data: string)`: returns base64 payload
- `decrypt(key: CryptoKey, payload: string)`: returns string
- `exportKey(key: CryptoKey)`: returns base64 raw bytes (for storage)
- `importKey(base64: string)`: returns CryptoKey
- All methods use Web Crypto API only

### `core/services/device.service.ts`
- `init()`: load device identity from SQLite, or generate new one
- `getDeviceId()`: returns deviceId
- `getPublicKeyJwk()`: returns public key as JWK object
- `getPrivateKey()`: returns private CryptoKey (imported from stored JWK)
- `getPairs()`: returns all pairs from SQLite
- `createPair(localContactId, remoteDeviceId, remotePublicKey, label)`: derives shared key, stores pair
- `removePair(id)`: deletes pair from SQLite
- `generateQrPayload(contactId)`: returns JSON string for QR code
- `processScanResult(qrData)`: parses scanned QR, initiates pairing

### `core/services/relay.service.ts`
- `send(pairId: string, sender: string, payload: string)`: POST to sync_messages
- `fetch(pairId: string, excludeSender: string)`: GET new messages
- `delete(messageId: string)`: DELETE processed message
- `computePairId(deviceIdA: string, deviceIdB: string)`: sorted + SHA-256 hash
- Uses PocketBase JS SDK (only for sync_messages collection, no auth)

### `core/services/encrypted-sync.service.ts`
- `sendSyncEvent(pairId: string, event: SyncEvent)`: encrypt + relay.send
- `pollAll()`: for each pair, fetch + decrypt + apply
- `applySyncEvent(event: SyncEvent)`: upsert/delete in SQLite
- `notifyChange(table, recordId, action, data)`: called by contact/transaction/courier services when a shared record changes
- `startPolling(intervalMs)`: periodic poll
- Replaces the old `sync.service.ts` entirely

## UI Changes

### Removed
- Login page (no auth)
- `auth.guard.ts` (no route protection needed)
- PocketBase auth UI in profile
- "Sync einrichten" with login form

### Modified: Profile Page
- Remove "Sync" status showing online/offline for PocketBase auth
- Remove logout button
- Add "Geräte-ID" display (for debugging)
- Keep language, network, courier-dashboard items

### Modified: Contact Detail Page
- "User verlinken" action → opens QR code pairing flow instead of username prompt
- New flow: shows QR code with contact info, OR scan partner's QR code
- Show pairing status: "Verlinkt mit [label]" if pair exists for this contact
- "Verlinkung aufheben" action to remove pair

### New: QR Scanner Page/Modal
- Camera view for scanning QR codes
- Uses `html5-qrcode` library (works in PWA + Capacitor)
- On successful scan: parse QR data, create pair, create mirror contact, send initial sync message

### New: QR Display Component
- Shows QR code containing device public key + contact info
- Uses `qrcode` npm package for generation
- Rendered as SVG or canvas

## npm Packages

- `qrcode` — QR code generation (small, well-maintained)
- `html5-qrcode` — QR code scanning via camera (works on web + mobile)
- Remove: `pocketbase` can stay (used as relay client) but auth features unused

## Migration from Current State

1. Remove `auth.service.ts` → create `user.service.ts` (local-only user, no PB auth)
2. Remove `auth.guard.ts`
3. Remove `pocketbase.service.ts` → create `relay.service.ts`
4. Remove `sync.service.ts` → create `encrypted-sync.service.ts`
5. Remove login page route (keep the file as template for QR scanner page)
6. Add `device` and `pairs` tables to SQLite
7. Create PocketBase `sync_messages` collection (via admin UI or migration)
8. Update contact detail: "User verlinken" → QR pairing flow
9. Update profile: remove auth UI, add device info
10. Wire encrypted-sync into contact/transaction/courier services

## Security Properties

- **Server sees nothing:** All payloads are AES-256-GCM encrypted. Relay cannot read content.
- **No user accounts:** No emails, passwords, usernames on the server.
- **Per-pair keys:** Compromising one pair doesn't expose others.
- **Forward secrecy:** Not provided (static ECDH keys). Acceptable for this use case — the threat model is a relay server, not a nation-state attacker.
- **QR code = trust anchor:** Pairing requires physical proximity (scanning QR). No remote pairing possible without the QR data.
- **Device key compromise:** If a device is stolen, attacker can read local SQLite AND decrypt all pair data. Mitigation: device encryption (OS-level) and optional app PIN (future feature).
