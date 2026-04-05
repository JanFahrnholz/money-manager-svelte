# E2E Encrypted Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PocketBase auth + plaintext sync with local-only identity, QR-code pairing per contact, and AES-256-GCM encrypted relay sync.

**Architecture:** Each device has an ECDH P-256 keypair. Pairing happens per contact link via QR code scan. Shared AES key is derived via ECDH. PocketBase becomes a dumb relay storing only encrypted blobs in a `sync_messages` collection. No user accounts exist on the server.

**Tech Stack:** Web Crypto API (ECDH P-256, AES-256-GCM, HKDF), PocketBase (relay only), `qrcode` (generate), `html5-qrcode` (scan), Angular 20 + Ionic 8

**Spec:** `docs/superpowers/specs/2026-04-05-e2e-encrypted-sync-design.md`

---

## File Structure

```
app2/src/app/
  core/
    services/
      crypto.service.ts        — NEW: Web Crypto key gen, ECDH, AES encrypt/decrypt
      device.service.ts        — NEW: Device identity, keypair, pair management
      relay.service.ts         — NEW: PocketBase sync_messages CRUD (replaces pocketbase.service.ts)
      encrypted-sync.service.ts— NEW: SyncEvent creation, encrypt, send, poll, apply (replaces sync.service.ts)
      user.service.ts          — NEW: Local-only user (replaces auth.service.ts)
      sqlite.service.ts        — MODIFY: add device + pairs tables
      toast.service.ts         — UNCHANGED
    guards/
      auth.guard.ts            — DELETE
    models/
      user.model.ts            — UNCHANGED
      contact.model.ts         — UNCHANGED
      transaction.model.ts     — UNCHANGED
      courier-link.model.ts    — UNCHANGED
      pair.model.ts            — NEW: Pair interface
      sync-event.model.ts      — NEW: SyncEvent interface
  shared/
    components/
      qr-display/              — NEW: QR code generator component
      qr-scanner/              — NEW: Camera QR scanner component
  features/
    auth/                      — DELETE entire directory
    contacts/
      pages/contact-detail/    — MODIFY: replace linkUser with QR pairing flow
    profile/
      pages/profile/           — MODIFY: remove auth UI, add device info + pairs list
  app.ts                       — MODIFY: use UserService instead of AuthService
  app.routes.ts                — MODIFY: remove auth route, add scan route
```

---

### Task 1: Install QR packages + add new SQLite tables

**Files:**
- Modify: `app2/package.json`
- Modify: `app2/src/app/core/services/sqlite.service.ts`

- [ ] **Step 1: Install QR packages**

```bash
cd app2
npm install qrcode html5-qrcode
npm install --save-dev @types/qrcode
```

- [ ] **Step 2: Add `device` and `pairs` tables to SQLite**

In `app2/src/app/core/services/sqlite.service.ts`, add after the `statistics` table creation:

```typescript
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS device (
        id TEXT PRIMARY KEY,
        publicKey TEXT NOT NULL,
        privateKey TEXT NOT NULL,
        created TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY,
        localContactId TEXT NOT NULL,
        remoteDeviceId TEXT NOT NULL,
        remotePublicKey TEXT NOT NULL,
        sharedKey TEXT NOT NULL,
        label TEXT DEFAULT '',
        created TEXT NOT NULL
      );
    `);
```

- [ ] **Step 3: Create new model files**

Create `app2/src/app/core/models/pair.model.ts`:
```typescript
export interface Pair {
  id: string;
  localContactId: string;
  remoteDeviceId: string;
  remotePublicKey: string;
  sharedKey: string;
  label: string;
  created: string;
}
```

Create `app2/src/app/core/models/sync-event.model.ts`:
```typescript
export interface SyncEvent {
  action: 'upsert' | 'delete';
  table: 'contacts' | 'transactions' | 'courier_links';
  recordId: string;
  data: Record<string, any>;
  timestamp: string;
}
```

- [ ] **Step 4: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 5: Commit**

```bash
git add app2/
git commit -m "feat(app2): add QR packages, device/pairs SQLite tables, and sync models"
```

---

### Task 2: Crypto Service (Web Crypto API)

**Files:**
- Create: `app2/src/app/core/services/crypto.service.ts`

- [ ] **Step 1: Create crypto service**

Create `app2/src/app/core/services/crypto.service.ts`:

```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {

  async generateKeyPair(): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey'],
    );
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    return { publicKey, privateKey };
  }

  async deriveSharedKey(myPrivateKeyJwk: JsonWebKey, theirPublicKeyJwk: JsonWebKey): Promise<string> {
    const privateKey = await crypto.subtle.importKey(
      'jwk', myPrivateKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey'],
    );
    const publicKey = await crypto.subtle.importKey(
      'jwk', theirPublicKeyJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
    );
    const derivedKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: publicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
    const raw = await crypto.subtle.exportKey('raw', derivedKey);
    return this.bufferToBase64(raw);
  }

  async encrypt(sharedKeyBase64: string, plaintext: string): Promise<string> {
    const key = await this.importAesKey(sharedKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return this.bufferToBase64(combined.buffer);
  }

  async decrypt(sharedKeyBase64: string, payload: string): Promise<string> {
    const key = await this.importAesKey(sharedKeyBase64);
    const data = this.base64ToBuffer(payload);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  async hashPairId(deviceIdA: string, deviceIdB: string): Promise<string> {
    const sorted = [deviceIdA, deviceIdB].sort().join(':');
    const encoded = new TextEncoder().encode(sorted);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return this.bufferToBase64(hash).slice(0, 22);
  }

  private async importAesKey(base64: string): Promise<CryptoKey> {
    const raw = this.base64ToBuffer(base64);
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/crypto.service.ts
git commit -m "feat(app2): add crypto service with ECDH key exchange and AES-GCM encryption"
```

---

### Task 3: Device Service (identity + pair management)

**Files:**
- Create: `app2/src/app/core/services/device.service.ts`

- [ ] **Step 1: Create device service**

Create `app2/src/app/core/services/device.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { CryptoService } from './crypto.service';
import type { Pair } from '../models/pair.model';

interface DeviceIdentity {
  id: string;
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  readonly deviceId = signal('');
  readonly pairs = signal<Pair[]>([]);
  private identity: DeviceIdentity | null = null;

  constructor(private sqlite: SqliteService, private crypto: CryptoService) {}

  async init(): Promise<void> {
    const rows = await this.sqlite.query<{ id: string; publicKey: string; privateKey: string }>(
      'SELECT * FROM device LIMIT 1',
    );

    if (rows.length > 0) {
      this.identity = {
        id: rows[0].id,
        publicKey: JSON.parse(rows[0].publicKey),
        privateKey: JSON.parse(rows[0].privateKey),
      };
    } else {
      const { publicKey, privateKey } = await this.crypto.generateKeyPair();
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
      this.identity = { id, publicKey, privateKey };
      await this.sqlite.run(
        'INSERT INTO device (id, publicKey, privateKey, created) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(publicKey), JSON.stringify(privateKey), new Date().toISOString()],
      );
    }

    this.deviceId.set(this.identity.id);
    await this.loadPairs();
  }

  getPublicKeyJwk(): JsonWebKey {
    return this.identity!.publicKey;
  }

  getPrivateKeyJwk(): JsonWebKey {
    return this.identity!.privateKey;
  }

  generateQrPayload(contactId: string, contactName: string): string {
    return JSON.stringify({
      deviceId: this.identity!.id,
      publicKey: this.identity!.publicKey,
      contactId,
      contactName,
    });
  }

  async createPair(localContactId: string, remoteDeviceId: string, remotePublicKeyJwk: JsonWebKey, label: string): Promise<Pair> {
    const sharedKey = await this.crypto.deriveSharedKey(this.identity!.privateKey, remotePublicKeyJwk);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
    const pair: Pair = {
      id,
      localContactId,
      remoteDeviceId,
      remotePublicKey: JSON.stringify(remotePublicKeyJwk),
      sharedKey,
      label,
      created: new Date().toISOString(),
    };
    await this.sqlite.upsert('pairs', pair);
    this.pairs.update(list => [...list, pair]);
    return pair;
  }

  async removePair(id: string): Promise<void> {
    await this.sqlite.delete('pairs', id);
    this.pairs.update(list => list.filter(p => p.id !== id));
  }

  getPairForContact(contactId: string): Pair | undefined {
    return this.pairs().find(p => p.localContactId === contactId);
  }

  private async loadPairs(): Promise<void> {
    const rows = await this.sqlite.getAll<Pair>('pairs', 'created DESC');
    this.pairs.set(rows);
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/device.service.ts
git commit -m "feat(app2): add device service with identity management and QR pair creation"
```

---

### Task 4: Relay Service (replaces PocketBase service)

**Files:**
- Create: `app2/src/app/core/services/relay.service.ts`
- Delete: `app2/src/app/core/services/pocketbase.service.ts` (after all references updated)

- [ ] **Step 1: Create relay service**

Create `app2/src/app/core/services/relay.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import PocketBase from 'pocketbase';

const RELAY_URL = 'http://localhost:8090';

@Injectable({ providedIn: 'root' })
export class RelayService {
  private pb = new PocketBase(RELAY_URL);
  readonly online = signal(false);

  constructor() {
    this.pb.autoCancellation(false);
    this.checkConnection();
  }

  async checkConnection(): Promise<void> {
    try {
      await this.pb.health.check();
      this.online.set(true);
    } catch {
      this.online.set(false);
    }
  }

  async send(pairId: string, sender: string, payload: string): Promise<void> {
    await this.pb.collection('sync_messages').create({ pairId, sender, payload });
  }

  async fetch(pairId: string, excludeSender: string): Promise<{ id: string; payload: string; created: string }[]> {
    try {
      const records = await this.pb.collection('sync_messages').getFullList({
        filter: `pairId="${pairId}" && sender!="${excludeSender}"`,
        sort: 'created',
      });
      return records.map(r => ({ id: r.id, payload: r['payload'], created: r['created'] }));
    } catch {
      return [];
    }
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      await this.pb.collection('sync_messages').delete(id);
    } catch {
      // Already deleted or not found — ignore
    }
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/relay.service.ts
git commit -m "feat(app2): add relay service for encrypted sync message transport"
```

---

### Task 5: Encrypted Sync Service (replaces sync service)

**Files:**
- Create: `app2/src/app/core/services/encrypted-sync.service.ts`

- [ ] **Step 1: Create encrypted sync service**

Create `app2/src/app/core/services/encrypted-sync.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { CryptoService } from './crypto.service';
import { DeviceService } from './device.service';
import { RelayService } from './relay.service';
import type { SyncEvent } from '../models/sync-event.model';
import type { Pair } from '../models/pair.model';

@Injectable({ providedIn: 'root' })
export class EncryptedSyncService {
  readonly syncing = signal(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sqlite: SqliteService,
    private crypto: CryptoService,
    private device: DeviceService,
    private relay: RelayService,
  ) {}

  async sendSyncEvent(pair: Pair, event: SyncEvent): Promise<void> {
    if (!this.relay.online()) return;
    try {
      const json = JSON.stringify(event);
      const payload = await this.crypto.encrypt(pair.sharedKey, json);
      const pairId = await this.crypto.hashPairId(this.device.deviceId(), pair.remoteDeviceId);
      await this.relay.send(pairId, this.device.deviceId(), payload);
    } catch (e) {
      console.error('[EncryptedSync] send failed:', e);
    }
  }

  async notifyChange(table: string, recordId: string, action: 'upsert' | 'delete', data: Record<string, any>): Promise<void> {
    const contactId = table === 'contacts' ? recordId : data['contact'] || '';
    const pairs = this.device.pairs();

    for (const pair of pairs) {
      let shouldSync = false;
      if (table === 'contacts' && pair.localContactId === recordId) shouldSync = true;
      if (table === 'transactions' && pair.localContactId === contactId) shouldSync = true;
      if (table === 'courier_links') {
        const contact = await this.sqlite.getById<any>('contacts', pair.localContactId);
        if (contact && (data['manager'] === contact['owner'] || data['courier'] === contact['user'])) {
          shouldSync = true;
        }
      }

      if (shouldSync) {
        const event: SyncEvent = { action, table: table as SyncEvent['table'], recordId, data, timestamp: new Date().toISOString() };
        await this.sendSyncEvent(pair, event);
      }
    }
  }

  async pollAll(): Promise<void> {
    if (this.syncing() || !this.relay.online()) return;
    this.syncing.set(true);

    try {
      const pairs = this.device.pairs();
      for (const pair of pairs) {
        const pairId = await this.crypto.hashPairId(this.device.deviceId(), pair.remoteDeviceId);
        const messages = await this.relay.fetch(pairId, this.device.deviceId());

        for (const msg of messages) {
          try {
            const json = await this.crypto.decrypt(pair.sharedKey, msg.payload);
            const event: SyncEvent = JSON.parse(json);
            await this.applySyncEvent(event);
            await this.relay.deleteMessage(msg.id);
          } catch (e) {
            console.error('[EncryptedSync] decrypt/apply failed:', e);
          }
        }
      }
    } finally {
      this.syncing.set(false);
    }
  }

  private async applySyncEvent(event: SyncEvent): Promise<void> {
    if (event.action === 'delete') {
      await this.sqlite.delete(event.table, event.recordId);
      return;
    }

    const existing = await this.sqlite.getById<any>(event.table, event.recordId);
    if (existing && existing['updated'] > event.timestamp) return; // local is newer

    const { synced, ...data } = event.data;
    await this.sqlite.upsert(event.table, { ...data, id: event.recordId, synced: 1 });
  }

  startPolling(intervalMs = 30_000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.pollAll(), intervalMs);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/services/encrypted-sync.service.ts
git commit -m "feat(app2): add encrypted sync service with per-pair polling and SyncEvent dispatch"
```

---

### Task 6: User Service (replaces Auth Service) + remove old auth

**Files:**
- Create: `app2/src/app/core/services/user.service.ts`
- Delete: `app2/src/app/core/services/auth.service.ts`
- Delete: `app2/src/app/core/services/pocketbase.service.ts`
- Delete: `app2/src/app/core/services/sync.service.ts`
- Delete: `app2/src/app/core/guards/auth.guard.ts`
- Delete: `app2/src/app/features/auth/` (entire directory)
- Modify: `app2/src/app/app.ts`
- Modify: `app2/src/app/app.routes.ts`
- Modify: ALL files that import AuthService or PocketbaseService or SyncService

- [ ] **Step 1: Create user service**

Create `app2/src/app/core/services/user.service.ts`:

```typescript
import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly user = signal<User | null>(null);

  constructor(private sqlite: SqliteService) {}

  async init(): Promise<void> {
    const existing = await this.sqlite.query<User>('SELECT * FROM users LIMIT 1');
    if (existing.length > 0) {
      this.user.set(existing[0]);
    } else {
      const now = new Date().toISOString();
      const localUser: User = {
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 15),
        username: 'local',
        balance: 0,
        settings: {},
        language: localStorage.getItem('language') || 'de',
        created: now,
        updated: now,
      };
      await this.sqlite.upsert('users', localUser as unknown as Record<string, any>);
      this.user.set(localUser);
    }
  }

  async updateBalance(delta: number): Promise<void> {
    const user = this.user();
    if (!user) return;
    const newBalance = user.balance + delta;
    await this.sqlite.run(
      'UPDATE users SET balance = ?, updated = ? WHERE id = ?',
      [newBalance, new Date().toISOString(), user.id],
    );
    this.user.set({ ...user, balance: newBalance });
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    const user = this.user();
    if (!user) return;
    const merged = { ...user.settings, ...settings };
    await this.sqlite.run(
      'UPDATE users SET settings = ?, updated = ? WHERE id = ?',
      [JSON.stringify(merged), new Date().toISOString(), user.id],
    );
    this.user.set({ ...user, settings: merged });
  }
}
```

- [ ] **Step 2: Delete old files**

```bash
rm app2/src/app/core/services/auth.service.ts
rm app2/src/app/core/services/pocketbase.service.ts
rm app2/src/app/core/services/sync.service.ts
rm app2/src/app/core/guards/auth.guard.ts
rm -rf app2/src/app/features/auth
```

- [ ] **Step 3: Update `app.ts`**

Replace `app2/src/app/app.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './core/services/sqlite.service';
import { UserService } from './core/services/user.service';
import { DeviceService } from './core/services/device.service';
import { EncryptedSyncService } from './core/services/encrypted-sync.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  constructor(
    private sqlite: SqliteService,
    private user: UserService,
    private device: DeviceService,
    private sync: EncryptedSyncService,
    private translate: TranslateService,
  ) {
    const lang = localStorage.getItem('language') || 'de';
    this.translate.setDefaultLang('de');
    this.translate.use(lang);
  }

  async ngOnInit() {
    await this.sqlite.init();
    await this.user.init();
    await this.device.init();
    await this.sync.pollAll();
    this.sync.startPolling();
  }
}
```

- [ ] **Step 4: Update `app.routes.ts`**

Replace `app2/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/dashboard', pathMatch: 'full' },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.component').then(m => m.TabsComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'contacts', loadComponent: () => import('./features/contacts/pages/contact-list/contact-list.page').then(m => m.ContactListPage) },
      { path: 'contacts/:id', loadComponent: () => import('./features/contacts/pages/contact-detail/contact-detail.page').then(m => m.ContactDetailPage) },
      { path: 'transactions/create', loadComponent: () => import('./features/transactions/pages/transaction-create/transaction-create.page').then(m => m.TransactionCreatePage) },
      { path: 'transactions/planned', loadComponent: () => import('./features/transactions/pages/planned-list/planned-list.page').then(m => m.PlannedListPage) },
      { path: 'profile', loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage) },
      { path: 'profile/courier-dashboard', loadComponent: () => import('./features/couriers/pages/courier-dashboard/courier-dashboard.page').then(m => m.CourierDashboardPage) },
      { path: 'profile/network', loadComponent: () => import('./features/couriers/pages/network-overview/network-overview.page').then(m => m.NetworkOverviewPage) },
      { path: 'profile/network/:id', loadComponent: () => import('./features/couriers/pages/courier-detail/courier-detail.page').then(m => m.CourierDetailPage) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
```

- [ ] **Step 5: Update ALL files that import AuthService → UserService**

Search and replace across the codebase. Files that import from `auth.service`:
- `app2/src/app/features/contacts/services/contact.service.ts` — change `AuthService` → `UserService`, update import path
- `app2/src/app/features/transactions/services/transaction.service.ts` — same
- `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts` — same, also remove PocketbaseService import
- `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts` — same, also remove PocketbaseService import
- `app2/src/app/features/contacts/pages/contact-list/contact-list.page.ts` — if it imports AuthService
- `app2/src/app/features/couriers/services/courier.service.ts` — same
- `app2/src/app/features/couriers/pages/courier-dashboard/courier-dashboard.page.ts` — same
- `app2/src/app/features/couriers/pages/network-overview/network-overview.page.ts` — same
- `app2/src/app/features/transactions/pages/transaction-create/transaction-create.page.ts` — remove AuthService + CourierService PB dependency

For each file:
- Replace `import { AuthService }` → `import { UserService }`
- Replace import path `'../../../core/services/auth.service'` → `'../../../core/services/user.service'`
- Replace `this.auth.user()` → `this.user.user()` (or rename injection to keep `this.auth` pattern — but cleaner to rename)
- Remove any `PocketbaseService` imports and usages (online status can come from RelayService if needed)
- Replace `this.auth.updateBalance` → `this.user.updateBalance`

**For dashboard page specifically:** Remove the online/offline indicator that was using PocketbaseService. Replace with RelayService if needed, or simply remove.

- [ ] **Step 6: Verify build**

```bash
cd app2 && ng build
```

This is the critical step — many files change. Fix any import errors.

- [ ] **Step 7: Commit**

```bash
git add -A app2/
git commit -m "feat(app2): replace auth/pocketbase/sync with local-only user service and encrypted sync"
```

---

### Task 7: QR Display Component

**Files:**
- Create: `app2/src/app/shared/components/qr-display/qr-display.component.ts`

- [ ] **Step 1: Create QR display component**

Create `app2/src/app/shared/components/qr-display/qr-display.component.ts`:

```typescript
import { Component, input, signal, effect, ElementRef, viewChild } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  template: `<canvas #canvas style="width:100%;max-width:280px;margin:0 auto;display:block;"></canvas>`,
})
export class QrDisplayComponent {
  data = input.required<string>();
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const data = this.data();
      if (el && data) {
        QRCode.toCanvas(el, data, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
    });
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/shared/components/qr-display/
git commit -m "feat(app2): add QR code display component"
```

---

### Task 8: QR Scanner Component

**Files:**
- Create: `app2/src/app/shared/components/qr-scanner/qr-scanner.component.ts`

- [ ] **Step 1: Create QR scanner component**

Create `app2/src/app/shared/components/qr-scanner/qr-scanner.component.ts`:

```typescript
import { Component, output, signal, OnDestroy, AfterViewInit } from '@angular/core';
import { IonButton, IonText } from '@ionic/angular/standalone';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [IonButton, IonText],
  template: `
    <div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;"></div>
    @if (error()) {
      <ion-text color="danger" style="display:block;text-align:center;margin-top:8px;">
        <p>{{ error() }}</p>
      </ion-text>
    }
  `,
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  scanned = output<string>();
  error = signal('');
  private scanner: Html5Qrcode | null = null;

  async ngAfterViewInit() {
    try {
      this.scanner = new Html5Qrcode('qr-reader');
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          this.scanned.emit(text);
          this.stop();
        },
        () => {},
      );
    } catch (e: any) {
      this.error.set(e.message || 'Camera access denied');
    }
  }

  private async stop() {
    try {
      await this.scanner?.stop();
    } catch {}
  }

  async ngOnDestroy() {
    await this.stop();
  }
}
```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/shared/components/qr-scanner/
git commit -m "feat(app2): add QR code scanner component using html5-qrcode"
```

---

### Task 9: Contact Detail — replace linkUser with QR pairing

**Files:**
- Modify: `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts`

- [ ] **Step 1: Replace linkUser flow with QR pairing**

In `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts`:

1. Remove `PocketbaseService` import and injection
2. Add imports: `DeviceService`, `EncryptedSyncService`, `QrDisplayComponent`, `QrScannerComponent`, `IonModal`
3. Add signals:
   ```typescript
   pair = signal<Pair | null>(null);
   showQrModal = signal(false);
   showScanModal = signal(false);
   qrPayload = signal('');
   ```
4. In `loadData()`, after loading the contact: check for existing pair:
   ```typescript
   const existingPair = this.deviceService.getPairForContact(contact.id);
   this.pair.set(existingPair ?? null);
   ```
5. Replace the `showLinkUserAlert()` method with:
   ```typescript
   showLinkQr() {
     const c = this.contact();
     if (!c) return;
     this.qrPayload.set(this.deviceService.generateQrPayload(c.id, c.name));
     this.showQrModal.set(true);
   }
   ```
6. Add `onQrScanned(data: string)` method:
   ```typescript
   async onQrScanned(data: string) {
     this.showScanModal.set(false);
     try {
       const parsed = JSON.parse(data);
       const { deviceId, publicKey, contactId, contactName } = parsed;
       const c = this.contact();
       if (!c) return;
       const pair = await this.deviceService.createPair(c.id, deviceId, publicKey, contactName);
       this.pair.set(pair);
       await this.contactService.update(c.id, { user: deviceId, linkedName: contactName });
       this.contact.set({ ...c, user: deviceId, linkedName: contactName });
       // Send initial sync: the contact record
       await this.encryptedSync.notifyChange('contacts', c.id, 'upsert', c);
       this.toast.success('Verlinkt mit ' + contactName);
     } catch (e) {
       this.toast.error('QR-Code ungültig');
     }
   }
   ```
7. Add `unlinkContact()` method:
   ```typescript
   async unlinkContact() {
     const p = this.pair();
     const c = this.contact();
     if (!p || !c) return;
     await this.deviceService.removePair(p.id);
     await this.contactService.update(c.id, { user: '', linkedName: '' });
     this.contact.set({ ...c, user: '', linkedName: '' });
     this.pair.set(null);
     this.toast.success('Verlinkung aufgehoben');
   }
   ```
8. Update `actionButtons` computed:
   - Replace "User verlinken" with "QR-Code anzeigen" (shows my QR) and "QR-Code scannen" (scans partner's QR)
   - If `pair()` exists: show "Verlinkt mit [label]" (info) and "Verlinkung aufheben" (destructive)
9. Add QR modal templates at the bottom of the template:
   ```html
   <ion-modal [isOpen]="showQrModal()" (didDismiss)="showQrModal.set(false)">
     <ng-template>
       <ion-header><ion-toolbar><ion-title>QR-Code</ion-title><ion-buttons slot="end"><ion-button (click)="showQrModal.set(false)">Fertig</ion-button></ion-buttons></ion-toolbar></ion-header>
       <ion-content class="ion-padding" style="text-align:center;">
         <p>Lass deinen Partner diesen Code scannen</p>
         <app-qr-display [data]="qrPayload()" />
       </ion-content>
     </ng-template>
   </ion-modal>

   <ion-modal [isOpen]="showScanModal()" (didDismiss)="showScanModal.set(false)">
     <ng-template>
       <ion-header><ion-toolbar><ion-title>Scannen</ion-title><ion-buttons slot="end"><ion-button (click)="showScanModal.set(false)">Abbrechen</ion-button></ion-buttons></ion-toolbar></ion-header>
       <ion-content class="ion-padding">
         <app-qr-scanner (scanned)="onQrScanned($event)" />
       </ion-content>
     </ng-template>
   </ion-modal>
   ```

10. Add i18n keys to both de.json and en.json:
    ```
    "contact.showQr": "QR-Code anzeigen" / "Show QR Code"
    "contact.scanQr": "QR-Code scannen" / "Scan QR Code"
    "contact.linked": "Verlinkt mit" / "Linked with"
    "contact.unlink": "Verlinkung aufheben" / "Unlink"
    "contact.qrInvalid": "QR-Code ungültig" / "Invalid QR code"
    "contact.qrScanPrompt": "Lass deinen Partner diesen Code scannen" / "Have your partner scan this code"
    ```

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/
git commit -m "feat(app2): replace user linking with QR code pairing on contact detail"
```

---

### Task 10: Profile Page — remove auth UI, add device info + pairs

**Files:**
- Modify: `app2/src/app/features/profile/pages/profile/profile.page.ts`

- [ ] **Step 1: Update profile page**

Rewrite `app2/src/app/features/profile/pages/profile/profile.page.ts`:

1. Remove `AuthService`, `PocketbaseService` imports
2. Add `UserService`, `DeviceService`, `RelayService` imports
3. Replace user info section: show username from UserService
4. Replace sync section: show relay online status from RelayService, device ID
5. Remove logout button entirely
6. Add "Aktive Verlinkungen" section: list of pairs with label + unlink button
7. Keep language selector, network link, courier dashboard link

Template changes:
- Sync item: show "Relay: Online/Offline" with RelayService.online()
- New item: "Geräte-ID: [first 8 chars...]" as copyable text
- New section: list of pairs showing `pair.label` + localContactId (resolve contact name) + "Aufheben" button

- [ ] **Step 2: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 3: Commit**

```bash
git add app2/
git commit -m "feat(app2): update profile page with device info, pairs list, remove auth UI"
```

---

### Task 11: Wire encrypted sync into data services

**Files:**
- Modify: `app2/src/app/features/contacts/services/contact.service.ts`
- Modify: `app2/src/app/features/transactions/services/transaction.service.ts`
- Modify: `app2/src/app/features/couriers/services/courier.service.ts`

- [ ] **Step 1: Wire sync into contact service**

In `app2/src/app/features/contacts/services/contact.service.ts`:
- Inject `EncryptedSyncService`
- After `create()`: call `this.sync.notifyChange('contacts', id, 'upsert', contact)`
- After `update()`: call `this.sync.notifyChange('contacts', id, 'upsert', { ...existing, ...data })`
- After `remove()`: call `this.sync.notifyChange('contacts', id, 'delete', { id })`

- [ ] **Step 2: Wire sync into transaction service**

In `app2/src/app/features/transactions/services/transaction.service.ts`:
- Inject `EncryptedSyncService`
- After `create()` (non-planned): call `this.sync.notifyChange('transactions', tx.id, 'upsert', tx)`
- After `confirmPlanned()`: call `this.sync.notifyChange('transactions', id, 'upsert', confirmedTx)`
- After `remove()`: call `this.sync.notifyChange('transactions', id, 'delete', { id, contact: tx.contact })`

- [ ] **Step 3: Wire sync into courier service**

In `app2/src/app/features/couriers/services/courier.service.ts`:
- Inject `EncryptedSyncService`
- After `create()`: call `this.sync.notifyChange('courier_links', link.id, 'upsert', link)`
- After `restock()/collect()/redeemBonus()/updateBonusPercentage()`: fetch updated link, call notifyChange
- After `remove()`: call `this.sync.notifyChange('courier_links', id, 'delete', { id })`

- [ ] **Step 4: Verify build**

```bash
cd app2 && ng build
```

- [ ] **Step 5: Commit**

```bash
git add app2/
git commit -m "feat(app2): wire encrypted sync into contact, transaction, and courier services"
```

---

### Task 12: Create PocketBase sync_messages collection

**Files:**
- Create: `pocketbase/pb_migrations/sync_messages.js` (or use PB admin UI)

- [ ] **Step 1: Create migration or document manual setup**

Create `app2/SYNC_SETUP.md`:

```markdown
# Sync Server Setup

The app uses PocketBase as a relay server for encrypted sync messages.

## Create the `sync_messages` collection

In PocketBase Admin UI (http://localhost:8090/_/):

1. Create new collection: `sync_messages`
2. Type: Base
3. Fields:
   - `pairId` — Text, Required
   - `sender` — Text, Required
   - `payload` — Text, Required
4. API Rules (ALL public — security is in the encryption):
   - List rule: `` (empty = public)
   - View rule: `` (empty = public)
   - Create rule: `` (empty = public)
   - Delete rule: `` (empty = public)
5. No auth required
```

- [ ] **Step 2: Commit**

```bash
git add app2/SYNC_SETUP.md
git commit -m "docs(app2): add sync server setup instructions for PocketBase relay"
```

---

## Verification

After all tasks complete:

1. `cd app2 && ng serve` — app loads directly to dashboard (no login)
2. Profile shows device ID and relay status
3. Create a contact → open contact detail → "QR-Code anzeigen" shows QR
4. On second device/browser: create contact → "QR-Code scannen" → scan first device's QR
5. Both devices now show "Verlinkt mit [name]" on their respective contacts
6. Create a transaction on one device → within 30s appears on the other (encrypted via relay)
7. PocketBase admin: sync_messages collection shows only encrypted blobs — no readable data
8. Make contact a courier → courier data syncs between paired devices
