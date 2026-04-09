# Phase 2: Pairing, Viewer & Self-Hosted Relay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade crypto to X25519 + Double Ratchet, replace PocketBase relay with a minimal self-hosted relay server, implement Viewer role with remote cache sync.

**Architecture:** CryptoService upgraded from ECDH P-256 to X25519. New DoubleRatchetService manages per-pair ratchet state. Minimal relay server (Deno) replaces PocketBase. RelayService talks to the new server. Viewer pairs receive read-only contact+transaction data into remote cache tables.

**Tech Stack:** Angular 20, Web Crypto API (X25519, AES-256-GCM, HKDF), Deno (relay server), Docker

**Depends on:** Phase 1 completed

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `app2/src/app/core/services/crypto.service.ts` | Upgrade to X25519 + HKDF |
| Create | `app2/src/app/core/services/double-ratchet.service.ts` | Double Ratchet Protocol |
| Modify | `app2/src/app/core/services/relay.service.ts` | New relay API (PUT/GET/DELETE) |
| Modify | `app2/src/app/core/services/device.service.ts` | X25519 key generation |
| Modify | `app2/src/app/core/services/encrypted-sync.service.ts` | Use Double Ratchet for encrypt/decrypt |
| Modify | `app2/src/app/core/services/sqlite.service.ts` | Add ratchet_state table, update pairs schema |
| Modify | `app2/src/app/core/models/pair.model.ts` | Add rootKey, chainKey fields |
| Create | `relay/main.ts` | Deno relay server |
| Create | `relay/Dockerfile` | Docker image |
| Modify | `app2/src/app/features/profile/pages/profile/profile.page.ts` | Relay URL config |
| Modify | `app2/src/app/features/linkages/pages/linkage-detail/linkage-detail.page.ts` | Viewer read-only view |
| Modify | `app2/src/assets/i18n/de.json` | New translation keys |

---

### Task 1: Upgrade CryptoService to X25519

**Files:**
- Modify: `app2/src/app/core/services/crypto.service.ts`

- [ ] **Step 1: Replace ECDH P-256 with X25519 key generation**

```typescript
// crypto.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {

  async generateKeyPair(): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'X25519' },  // was 'ECDH' with namedCurve: 'P-256'
      true,
      ['deriveBits']
    );
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    return { publicKey, privateKey };
  }

  async deriveSharedKey(myPrivateKeyJwk: JsonWebKey, theirPublicKeyJwk: JsonWebKey): Promise<CryptoKey> {
    const myPrivateKey = await crypto.subtle.importKey(
      'jwk', myPrivateKeyJwk, { name: 'X25519' }, false, ['deriveBits']
    );
    const theirPublicKey = await crypto.subtle.importKey(
      'jwk', theirPublicKeyJwk, { name: 'X25519' }, false, []
    );

    const sharedBits = await crypto.subtle.deriveBits(
      { name: 'X25519', public: theirPublicKey },
      myPrivateKey,
      256
    );

    // HKDF to derive AES key from shared bits
    const ikm = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('MoneyManager-v2') },
      ikm,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encrypt(key: CryptoKey, plaintext: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  async decrypt(key: CryptoKey, payload: string): Promise<string> {
    const data = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  async hkdfExpand(ikm: ArrayBuffer, info: string, length: number): Promise<ArrayBuffer> {
    const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(info) },
      key,
      length * 8
    );
  }

  async hashPairId(deviceIdA: string, deviceIdB: string): Promise<string> {
    const sorted = [deviceIdA, deviceIdB].sort().join(':');
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sorted));
    return btoa(String.fromCharCode(...new Uint8Array(hash))).slice(0, 22);
  }
}
```

- [ ] **Step 2: Verify X25519 key generation works**

Run: `ng serve`, check browser console for errors.
Note: X25519 requires Chrome 133+, Firefox 135+, Safari 18.2+.

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/crypto.service.ts
git commit -m "feat(app2): upgrade CryptoService to X25519 + HKDF"
```

---

### Task 2: Create Double Ratchet Service

**Files:**
- Create: `app2/src/app/core/services/double-ratchet.service.ts`
- Modify: `app2/src/app/core/services/sqlite.service.ts` (add ratchet_state table)

- [ ] **Step 1: Add ratchet_state table**

In `sqlite.service.ts`, in `createTables()`:

```typescript
await this.db.execute(`CREATE TABLE IF NOT EXISTS ratchet_state (
  pairId TEXT PRIMARY KEY,
  rootKey TEXT NOT NULL,
  sendChainKey TEXT NOT NULL,
  receiveChainKey TEXT NOT NULL,
  sendCounter INTEGER DEFAULT 0,
  receiveCounter INTEGER DEFAULT 0,
  myEphemeralPublic TEXT DEFAULT '',
  myEphemeralPrivate TEXT DEFAULT '',
  theirEphemeralPublic TEXT DEFAULT '',
  updated TEXT NOT NULL
)`);
```

- [ ] **Step 2: Implement Double Ratchet service**

```typescript
// double-ratchet.service.ts
import { Injectable } from '@angular/core';
import { CryptoService } from './crypto.service';
import { SqliteService } from './sqlite.service';

interface RatchetState {
  pairId: string;
  rootKey: string;           // base64
  sendChainKey: string;      // base64
  receiveChainKey: string;   // base64
  sendCounter: number;
  receiveCounter: number;
  myEphemeralPublic: string;  // JWK JSON
  myEphemeralPrivate: string; // JWK JSON
  theirEphemeralPublic: string; // JWK JSON
  updated: string;
}

@Injectable({ providedIn: 'root' })
export class DoubleRatchetService {

  constructor(private crypto: CryptoService, private sqlite: SqliteService) {}

  async initRatchet(pairId: string, sharedSecret: ArrayBuffer, isInitiator: boolean): Promise<void> {
    const rootKeyBuf = await this.crypto.hkdfExpand(sharedSecret, 'ratchet-root', 32);
    const sendBuf = await this.crypto.hkdfExpand(sharedSecret, isInitiator ? 'ratchet-send' : 'ratchet-recv', 32);
    const recvBuf = await this.crypto.hkdfExpand(sharedSecret, isInitiator ? 'ratchet-recv' : 'ratchet-send', 32);

    const ephemeral = await this.crypto.generateKeyPair();

    const state: RatchetState = {
      pairId,
      rootKey: this.bufToBase64(rootKeyBuf),
      sendChainKey: this.bufToBase64(sendBuf),
      receiveChainKey: this.bufToBase64(recvBuf),
      sendCounter: 0,
      receiveCounter: 0,
      myEphemeralPublic: JSON.stringify(ephemeral.publicKey),
      myEphemeralPrivate: JSON.stringify(ephemeral.privateKey),
      theirEphemeralPublic: '',
      updated: new Date().toISOString(),
    };

    await this.sqlite.upsert('ratchet_state', state);
  }

  async encryptMessage(pairId: string, plaintext: string): Promise<{ ciphertext: string; counter: number; ephemeralKey: string }> {
    const state = await this.getState(pairId);
    if (!state) throw new Error('No ratchet state for pair ' + pairId);

    // Derive message key from chain key
    const chainKeyBuf = this.base64ToBuf(state.sendChainKey);
    const messageKeyBuf = await this.crypto.hkdfExpand(chainKeyBuf, `msg-${state.sendCounter}`, 32);
    const nextChainBuf = await this.crypto.hkdfExpand(chainKeyBuf, 'chain-advance', 32);

    // Encrypt with message key
    const aesKey = await crypto.subtle.importKey('raw', messageKeyBuf, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const cipherBytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

    const combined = new Uint8Array(iv.length + cipherBytes.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherBytes), iv.length);

    const counter = state.sendCounter;

    // Update state
    state.sendChainKey = this.bufToBase64(nextChainBuf);
    state.sendCounter++;
    state.updated = new Date().toISOString();
    await this.sqlite.upsert('ratchet_state', state);

    return {
      ciphertext: btoa(String.fromCharCode(...combined)),
      counter,
      ephemeralKey: state.myEphemeralPublic,
    };
  }

  async decryptMessage(pairId: string, ciphertext: string, counter: number): Promise<string> {
    const state = await this.getState(pairId);
    if (!state) throw new Error('No ratchet state for pair ' + pairId);

    const chainKeyBuf = this.base64ToBuf(state.receiveChainKey);

    // Advance chain to the correct counter
    let currentChain = chainKeyBuf;
    for (let i = state.receiveCounter; i < counter; i++) {
      currentChain = await this.crypto.hkdfExpand(currentChain, 'chain-advance', 32);
    }

    const messageKeyBuf = await this.crypto.hkdfExpand(currentChain, `msg-${counter}`, 32);
    const nextChainBuf = await this.crypto.hkdfExpand(currentChain, 'chain-advance', 32);

    // Decrypt
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    const aesKey = await crypto.subtle.importKey('raw', messageKeyBuf, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, encrypted);

    // Update state
    state.receiveChainKey = this.bufToBase64(nextChainBuf);
    state.receiveCounter = counter + 1;
    state.updated = new Date().toISOString();
    await this.sqlite.upsert('ratchet_state', state);

    return new TextDecoder().decode(decrypted);
  }

  private async getState(pairId: string): Promise<RatchetState | null> {
    return this.sqlite.getById<RatchetState>('ratchet_state', pairId);
  }

  private bufToBase64(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  }

  private base64ToBuf(b64: string): ArrayBuffer {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/double-ratchet.service.ts app2/src/app/core/services/sqlite.service.ts
git commit -m "feat(app2): add Double Ratchet service with per-message key derivation"
```

---

### Task 3: Create Minimal Relay Server (Deno)

**Files:**
- Create: `relay/main.ts`
- Create: `relay/Dockerfile`
- Create: `relay/deno.json`

- [ ] **Step 1: Create relay server**

```typescript
// relay/main.ts
const kv = await Deno.openKv();
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const RATE_LIMIT = 100; // requests per minute per IP

const rateLimits = new Map<string, { count: number; reset: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.reset) {
    rateLimits.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

Deno.serve({ port: 8090 }, async (req) => {
  const url = new URL(req.url);
  const ip = req.headers.get('x-forwarded-for') || 'unknown';

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!rateLimit(ip)) {
    return new Response('Rate limit exceeded', { status: 429, headers: corsHeaders });
  }

  // PUT /messages — store a message
  if (req.method === 'PUT' && url.pathname === '/messages') {
    const body = await req.json();
    const { pairId, sender, payload } = body;
    if (!pairId || !sender || !payload) {
      return new Response('Missing fields', { status: 400, headers: corsHeaders });
    }
    const id = crypto.randomUUID();
    const created = new Date().toISOString();
    await kv.set(['messages', pairId, id], { id, pairId, sender, payload, created }, { expireIn: TTL_MS });
    return Response.json({ id, created }, { headers: corsHeaders });
  }

  // GET /messages?pair=X&exclude=Y — fetch messages for a pair
  if (req.method === 'GET' && url.pathname === '/messages') {
    const pairId = url.searchParams.get('pair');
    const exclude = url.searchParams.get('exclude');
    if (!pairId) {
      return new Response('Missing pair param', { status: 400, headers: corsHeaders });
    }
    const messages: any[] = [];
    for await (const entry of kv.list({ prefix: ['messages', pairId] })) {
      const msg = entry.value as any;
      if (exclude && msg.sender === exclude) continue;
      messages.push(msg);
    }
    messages.sort((a, b) => a.created.localeCompare(b.created));
    return Response.json(messages, { headers: corsHeaders });
  }

  // DELETE /messages/:id?pair=X — delete a message
  if (req.method === 'DELETE' && url.pathname.startsWith('/messages/')) {
    const id = url.pathname.split('/')[2];
    const pairId = url.searchParams.get('pair');
    if (!id || !pairId) {
      return new Response('Missing id or pair', { status: 400, headers: corsHeaders });
    }
    await kv.delete(['messages', pairId, id]);
    return new Response('OK', { headers: corsHeaders });
  }

  // GET /health
  if (req.method === 'GET' && url.pathname === '/health') {
    return Response.json({ status: 'ok' }, { headers: corsHeaders });
  }

  return new Response('Not found', { status: 404, headers: corsHeaders });
});
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
# relay/Dockerfile
FROM denoland/deno:2.0.0

WORKDIR /app
COPY main.ts .
COPY deno.json .

EXPOSE 8090
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--unstable-kv", "main.ts"]
```

- [ ] **Step 3: Create deno.json**

```json
{
  "tasks": {
    "start": "deno run --allow-net --allow-read --allow-write --unstable-kv main.ts",
    "dev": "deno run --watch --allow-net --allow-read --allow-write --unstable-kv main.ts"
  }
}
```

- [ ] **Step 4: Test relay locally**

```bash
cd relay && deno task dev
# In another terminal:
curl -X PUT http://localhost:8090/messages -H 'Content-Type: application/json' -d '{"pairId":"test","sender":"dev1","payload":"encrypted-blob"}'
curl http://localhost:8090/messages?pair=test
```

Expected: PUT returns `{ id, created }`. GET returns the message.

- [ ] **Step 5: Commit**

```bash
git add relay/
git commit -m "feat(relay): create minimal self-hosted relay server in Deno"
```

---

### Task 4: Update RelayService for New Server

**Files:**
- Modify: `app2/src/app/core/services/relay.service.ts`

- [ ] **Step 1: Replace PocketBase calls with fetch API**

```typescript
// relay.service.ts
import { Injectable, signal } from '@angular/core';

const DEFAULT_RELAY_URL = 'http://localhost:8090';

@Injectable({ providedIn: 'root' })
export class RelayService {
  readonly online = signal(false);

  private relayUrl = DEFAULT_RELAY_URL;

  setRelayUrl(url: string): void {
    this.relayUrl = url.replace(/\/$/, '');
  }

  getUrl(): string {
    return this.relayUrl;
  }

  async checkConnection(): Promise<void> {
    try {
      const res = await fetch(`${this.relayUrl}/health`);
      this.online.set(res.ok);
    } catch {
      this.online.set(false);
    }
  }

  async send(pairId: string, sender: string, payload: string): Promise<void> {
    await fetch(`${this.relayUrl}/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, sender, payload }),
    });
  }

  async fetch(pairId: string, excludeSender?: string): Promise<{ id: string; payload: string; created: string }[]> {
    const params = new URLSearchParams({ pair: pairId });
    if (excludeSender) params.set('exclude', excludeSender);
    const res = await fetch(`${this.relayUrl}/messages?${params}`);
    return res.json();
  }

  async fetchAll(excludeSender?: string): Promise<{ id: string; pairId: string; payload: string; created: string }[]> {
    // The new relay doesn't support fetchAll without pairId.
    // This will be called per-pair in EncryptedSyncService.
    return [];
  }

  async deleteMessage(id: string, pairId: string): Promise<void> {
    await fetch(`${this.relayUrl}/messages/${id}?pair=${pairId}`, { method: 'DELETE' });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app2/src/app/core/services/relay.service.ts
git commit -m "feat(app2): update RelayService for new self-hosted relay API"
```

---

### Task 5: Wire Double Ratchet into EncryptedSyncService

**Files:**
- Modify: `app2/src/app/core/services/encrypted-sync.service.ts`

- [ ] **Step 1: Replace direct AES encryption with Double Ratchet**

In `EncryptedSyncService`, replace calls to `crypto.encrypt(pair.sharedKey, ...)` with `ratchet.encryptMessage(pair.id, ...)`, and `crypto.decrypt(pair.sharedKey, ...)` with `ratchet.decryptMessage(pair.id, ...)`.

Key changes in `sendSyncEvent()`:

```typescript
// Before:
const encrypted = await this.crypto.encrypt(pair.sharedKey, JSON.stringify(event));
await this.relay.send(pairId, this.device.deviceId(), encrypted);

// After:
const { ciphertext, counter, ephemeralKey } = await this.ratchet.encryptMessage(
  pair.id, JSON.stringify(event)
);
const envelope = JSON.stringify({ ciphertext, counter, ephemeralKey });
await this.relay.send(pairId, this.device.deviceId(), envelope);
```

Key changes in message processing:

```typescript
// Before:
const decrypted = await this.crypto.decrypt(pair.sharedKey, msg.payload);

// After:
const envelope = JSON.parse(msg.payload);
const decrypted = await this.ratchet.decryptMessage(pair.id, envelope.ciphertext, envelope.counter);
```

Update `deleteMessage` calls to pass pairId:

```typescript
await this.relay.deleteMessage(msg.id, pair.id);
```

- [ ] **Step 2: Update DeviceService.createPair to init ratchet**

In `device.service.ts`, after creating a pair, initialize the ratchet:

```typescript
// After deriving shared key:
const sharedKeyBuf = /* derive from X25519 */;
await this.ratchet.initRatchet(pairId, sharedKeyBuf, isInitiator);
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/encrypted-sync.service.ts app2/src/app/core/services/device.service.ts
git commit -m "feat(app2): wire Double Ratchet into encrypted sync pipeline"
```

---

### Task 6: Add Relay URL Configuration to Profile

**Files:**
- Modify: `app2/src/app/features/profile/pages/profile/profile.page.ts`

- [ ] **Step 1: Add relay URL setting**

In the profile page template, add a setting item below language:

```html
<ion-item button (click)="editRelayUrl()">
  <ion-label>
    <h3>Relay Server</h3>
    <p>{{ relayUrl() }}</p>
  </ion-label>
</ion-item>
```

In the class:

```typescript
readonly relayUrl = signal(this.relay.getUrl());

async editRelayUrl(): Promise<void> {
  const alert = await this.alertCtrl.create({
    header: 'Relay Server URL',
    inputs: [{ name: 'url', type: 'url', value: this.relayUrl(), placeholder: 'https://relay.example.com' }],
    buttons: [
      { text: this.translate.instant('cancel'), role: 'cancel' },
      {
        text: this.translate.instant('save'),
        handler: (data: { url: string }) => {
          if (data.url?.trim()) {
            this.relay.setRelayUrl(data.url.trim());
            this.relayUrl.set(data.url.trim());
            localStorage.setItem('relayUrl', data.url.trim());
            this.relay.checkConnection();
          }
        },
      },
    ],
  });
  await alert.present();
}
```

Load saved relay URL on init:

```typescript
ngOnInit(): void {
  const saved = localStorage.getItem('relayUrl');
  if (saved) {
    this.relay.setRelayUrl(saved);
    this.relayUrl.set(saved);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app2/src/app/features/profile/pages/profile/profile.page.ts
git commit -m "feat(app2): add relay URL configuration in profile settings"
```

---

### Task 7: Viewer Read-Only View Enhancement

**Files:**
- Modify: `app2/src/app/features/linkages/pages/linkage-detail/linkage-detail.page.ts`

- [ ] **Step 1: Enhance viewer linkage detail**

The linkage detail page already shows remote contact balance and transactions. Enhance it with:
- Clear "Read-Only" indicator
- Balance explanation text ("X trackt: du schuldest Y€")
- Sorted transaction list with type icons

```html
<!-- Add to template: -->
@if (pair()?.role === 'viewer') {
  <ion-badge color="medium" style="margin:16px;">{{ 'profile.viewerReadOnly' | translate }}</ion-badge>

  @if (contact()) {
    <div style="text-align:center;padding:16px;">
      <div style="font-size:32px;font-weight:700;" [style.color]="contact()!.balance < 0 ? '#ff3b30' : '#4cd964'">
        {{ contact()!.balance | euro }}
      </div>
      <div style="color:#888;margin-top:4px;">
        {{ pair()!.label }} {{ 'balance.tracks' | translate }}
      </div>
    </div>
  }
}
```

- [ ] **Step 2: Add translation keys**

In `de.json`:
```json
"profile": {
  "viewerReadOnly": "Nur Lesen",
  "relayServer": "Relay Server"
}
```
```json
"balance": {
  "tracks": "trackt dich"
}
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/features/linkages/ app2/src/assets/i18n/
git commit -m "feat(app2): enhance viewer read-only linkage detail"
```

---

### Task 8: Integration Test — Full Pairing Flow

- [ ] **Step 1: Start relay server**

```bash
cd relay && deno task dev
```

- [ ] **Step 2: Test in browser**

1. Open app in two browser tabs (simulating two devices)
2. Device A: go to contact detail → "Verlinken" → show QR
3. Device B: scan QR (or paste manually)
4. Verify: Pair created on both sides
5. Device A: create a transaction for the linked contact
6. Wait for sync poll (30s or trigger manually)
7. Device B: go to Profil → Verlinkungen → tap linkage
8. Verify: Remote contact balance and transactions appear

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix(app2): phase 2 pairing + viewer integration fixes"
```
