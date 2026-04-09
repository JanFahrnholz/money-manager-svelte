# Phase 3: Posten-basiertes Agent-System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-balance courier model (inventoryBalance/salesBalance/bonusBalance) with a posten/batch-based system that supports both commission and prepaid models simultaneously.

**Architecture:** New `batches` table replaces the 3 balance fields on `courier_links` (renamed to `agent_links`). Each Restock creates a Batch with type (commission/prepaid) and its own bonusPercentage. Sales, Collect, Redeem operate on specific batches. Agent-Dashboard aggregates balances from all batches.

**Tech Stack:** Angular 20, SQLite, Angular Signals

**Depends on:** Phase 1 + Phase 2 completed

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `app2/src/app/core/services/sqlite.service.ts` | Add batches table, rename courier_links → agent_links |
| Create | `app2/src/app/core/models/batch.model.ts` | Batch interface |
| Modify | `app2/src/app/core/models/courier-link.model.ts` | Rename to AgentLink, remove balance fields |
| Create | `app2/src/app/core/services/agent.service.ts` | Replaces CourierService with batch-aware logic |
| Modify | `app2/src/app/features/couriers/pages/courier-detail/courier-detail.page.ts` | Batch list + per-batch actions |
| Modify | `app2/src/app/features/dashboard/pages/agent-dashboard/agent-dashboard.page.ts` | Aggregate from batches |
| Modify | `app2/src/app/features/transactions/services/transaction.service.ts` | Batch-aware Income/Restock/Collect/Redeem |
| Modify | `app2/src/app/features/transactions/pages/transaction-create/transaction-create.page.ts` | Batch picker for agent sales |
| Modify | `app2/src/app/core/services/encrypted-sync.service.ts` | Sync batches table |
| Modify | `app2/src/assets/i18n/de.json` | Batch-related translations |

---

### Task 1: Create Batch Model + Agent Link Model

**Files:**
- Create: `app2/src/app/core/models/batch.model.ts`
- Modify: `app2/src/app/core/models/courier-link.model.ts`

- [ ] **Step 1: Create Batch interface**

```typescript
// batch.model.ts
export interface Batch {
  id: string;
  agentLinkId: string;
  type: 'commission' | 'prepaid';
  amount: number;
  remaining: number;
  bonusPercentage: number;
  salesTotal: number;
  bonusTotal: number;
  collected: number;
  redeemed: number;
  created: string;
  updated: string;
}
```

- [ ] **Step 2: Update CourierLink → AgentLink**

```typescript
// courier-link.model.ts → keep file but add AgentLink
export interface AgentLink {
  id: string;
  manager: string;     // user ID of the manager
  agent: string;        // user ID of the agent (was: courier)
  contactId: string;    // contact linked to this agent
  pairId: string;       // pair for encrypted sync
  totalSales: number;
  created: string;
  updated: string;
  synced: boolean;
}

// Keep CourierLink as alias for backward compat during migration
export type CourierLink = AgentLink;
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/core/models/batch.model.ts app2/src/app/core/models/courier-link.model.ts
git commit -m "feat(app2): add Batch model, update AgentLink model"
```

---

### Task 2: Add Batches Table + Migrate Schema

**Files:**
- Modify: `app2/src/app/core/services/sqlite.service.ts`

- [ ] **Step 1: Add batches table and migration**

In `createTables()`:

```typescript
// New batches table
await this.db.execute(`CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  agentLinkId TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'commission',
  amount REAL NOT NULL DEFAULT 0,
  remaining REAL NOT NULL DEFAULT 0,
  bonusPercentage REAL DEFAULT 0,
  salesTotal REAL DEFAULT 0,
  bonusTotal REAL DEFAULT 0,
  collected REAL DEFAULT 0,
  redeemed REAL DEFAULT 0,
  created TEXT NOT NULL,
  updated TEXT NOT NULL
)`);

// Add remote_batches cache table
await this.db.execute(`CREATE TABLE IF NOT EXISTS remote_batches (
  id TEXT PRIMARY KEY,
  pairId TEXT NOT NULL,
  agentLinkId TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'commission',
  amount REAL DEFAULT 0,
  remaining REAL DEFAULT 0,
  bonusPercentage REAL DEFAULT 0,
  salesTotal REAL DEFAULT 0,
  bonusTotal REAL DEFAULT 0,
  collected REAL DEFAULT 0,
  redeemed REAL DEFAULT 0,
  created TEXT DEFAULT '',
  updated TEXT DEFAULT ''
)`);

// Add missing columns to courier_links for agent model
try { await this.db.execute("ALTER TABLE courier_links ADD COLUMN contactId TEXT DEFAULT ''"); } catch {}
try { await this.db.execute("ALTER TABLE courier_links ADD COLUMN pairId TEXT DEFAULT ''"); } catch {}

// Migrate existing courier_links balance data into batches
// For each courier_link with non-zero inventory, create a legacy batch
try {
  const links = await this.query<any>('SELECT * FROM courier_links WHERE inventoryBalance > 0 OR salesBalance > 0 OR bonusBalance > 0', []);
  for (const link of links) {
    const existing = await this.query<any>('SELECT id FROM batches WHERE agentLinkId = ? LIMIT 1', [link.id]);
    if (existing.length === 0) {
      const now = new Date().toISOString();
      await this.run(
        `INSERT OR IGNORE INTO batches (id, agentLinkId, type, amount, remaining, bonusPercentage, salesTotal, bonusTotal, collected, redeemed, created, updated)
         VALUES (?, ?, 'commission', ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        [crypto.randomUUID(), link.id, link.inventoryBalance + link.salesBalance, link.inventoryBalance, link.bonusPercentage, link.salesBalance, link.bonusBalance, now, now]
      );
    }
  }
} catch {}
```

- [ ] **Step 2: Commit**

```bash
git add app2/src/app/core/services/sqlite.service.ts
git commit -m "feat(app2): add batches + remote_batches tables with migration"
```

---

### Task 3: Create AgentService (replaces CourierService)

**Files:**
- Create: `app2/src/app/core/services/agent.service.ts`

- [ ] **Step 1: Implement AgentService**

```typescript
// agent.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { UserService } from './user.service';
import { EncryptedSyncService } from './encrypted-sync.service';
import type { AgentLink } from '../models/courier-link.model';
import type { Batch } from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  readonly myLinks = signal<AgentLink[]>([]);     // links I manage (I am manager)
  readonly managedBy = signal<AgentLink[]>([]);    // links managing me (I am agent)

  constructor(
    private sqlite: SqliteService,
    private user: UserService,
    private sync: EncryptedSyncService,
  ) {}

  async loadMyLinks(): Promise<void> {
    const userId = this.user.user()!.id;
    const links = await this.sqlite.query<AgentLink>(
      'SELECT * FROM courier_links WHERE manager = ? ORDER BY created DESC', [userId]
    );
    this.myLinks.set(links);
  }

  async loadManagedBy(): Promise<void> {
    const userId = this.user.user()!.id;
    const links = await this.sqlite.query<AgentLink>(
      'SELECT * FROM courier_links WHERE courier = ? ORDER BY created DESC', [userId]
    );
    this.managedBy.set(links);
  }

  async getBatchesForLink(agentLinkId: string): Promise<Batch[]> {
    return this.sqlite.query<Batch>(
      'SELECT * FROM batches WHERE agentLinkId = ? ORDER BY created ASC', [agentLinkId]
    );
  }

  async getOpenBatches(agentLinkId: string): Promise<Batch[]> {
    return this.sqlite.query<Batch>(
      'SELECT * FROM batches WHERE agentLinkId = ? AND remaining > 0 ORDER BY created ASC', [agentLinkId]
    );
  }

  async getAggregatedBalances(agentLinkId: string): Promise<{ inventory: number; sales: number; bonus: number }> {
    const batches = await this.getBatchesForLink(agentLinkId);
    return {
      inventory: batches.reduce((sum, b) => sum + b.remaining, 0),
      sales: batches.reduce((sum, b) => sum + (b.salesTotal - b.collected), 0),
      bonus: batches.reduce((sum, b) => sum + (b.bonusTotal - b.redeemed), 0),
    };
  }

  async createBatch(agentLinkId: string, amount: number, type: 'commission' | 'prepaid', bonusPercentage: number): Promise<Batch> {
    const now = new Date().toISOString();
    const batch: Batch = {
      id: crypto.randomUUID(),
      agentLinkId,
      type,
      amount,
      remaining: amount,
      bonusPercentage: type === 'prepaid' ? 0 : bonusPercentage,
      salesTotal: 0,
      bonusTotal: 0,
      collected: 0,
      redeemed: 0,
      created: now,
      updated: now,
    };
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
    return batch;
  }

  async recordSale(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    if (amount > batch.remaining) throw new Error('Insufficient inventory');

    batch.remaining -= amount;
    if (batch.type === 'commission') {
      batch.salesTotal += amount;
      batch.bonusTotal += amount * (batch.bonusPercentage / 100);
    }
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  async collect(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    const openSales = batch.salesTotal - batch.collected;
    if (amount > openSales) throw new Error('Amount exceeds open sales');

    batch.collected += amount;
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  async redeem(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    const openBonus = batch.bonusTotal - batch.redeemed;
    if (amount > openBonus) throw new Error('Amount exceeds open bonus');

    batch.redeemed += amount;
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  /** Find the oldest batch with remaining inventory (FIFO) */
  async getFifoBatch(agentLinkId: string): Promise<Batch | null> {
    const batches = await this.getOpenBatches(agentLinkId);
    return batches[0] ?? null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app2/src/app/core/services/agent.service.ts
git commit -m "feat(app2): create AgentService with batch-based inventory management"
```

---

### Task 4: Update TransactionService for Batch-Aware Operations

**Files:**
- Modify: `app2/src/app/features/transactions/services/transaction.service.ts`

- [ ] **Step 1: Update Restock to create batch**

```typescript
// In create() method, handle Restock:
case TransactionType.Restock: {
  // Restock now creates a Batch, not updates balance
  // batchType and bonusPercentage come from transaction metadata
  const batchType = (tx as any).batchType || 'commission';
  const bonusPct = (tx as any).bonusPercentage ?? 5;
  await this.agentService.createBatch(tx.courierLink, tx.amount, batchType, bonusPct);
  break;
}
```

- [ ] **Step 2: Update Income (agent sale) to deduct from batch**

```typescript
case TransactionType.Income: {
  await this.userService.updateBalance(tx.amount);
  if (tx.courierLink) {
    // Agent sale — deduct from batch
    const batchId = (tx as any).batchId;
    if (batchId) {
      await this.agentService.recordSale(batchId, tx.amount);
    } else {
      // FIFO fallback
      const batch = await this.agentService.getFifoBatch(tx.courierLink);
      if (batch) await this.agentService.recordSale(batch.id, tx.amount);
    }
  }
  break;
}
```

- [ ] **Step 3: Update Collect and Redeem**

```typescript
case TransactionType.Collect: {
  const batchId = (tx as any).batchId;
  if (batchId) await this.agentService.collect(batchId, tx.amount);
  break;
}
case TransactionType.Redeem: {
  const batchId = (tx as any).batchId;
  if (batchId) await this.agentService.redeem(batchId, tx.amount);
  break;
}
```

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/features/transactions/services/transaction.service.ts
git commit -m "feat(app2): batch-aware Restock/Income/Collect/Redeem in TransactionService"
```

---

### Task 5: Update Courier Detail Page — Show Batch List

**Files:**
- Modify: `app2/src/app/features/couriers/pages/courier-detail/courier-detail.page.ts`

- [ ] **Step 1: Replace 3-balance display with batch list**

Update the page to load batches from AgentService and show a list:

```typescript
readonly batches = signal<Batch[]>([]);

// In loadData():
const batches = await this.agentService.getBatchesForLink(linkId);
this.batches.set(batches);

// Aggregated values:
const agg = await this.agentService.getAggregatedBalances(linkId);
this.inventory.set(agg.inventory);
this.sales.set(agg.sales);
this.bonus.set(agg.bonus);
```

Add batch list to template:

```html
<!-- Batch List -->
<div style="padding:0 16px;margin-top:16px;">
  <div style="font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px;">
    Posten ({{ batches().length }})
  </div>
</div>
<ion-list>
  @for (batch of batches(); track batch.id) {
    <ion-item>
      <ion-label>
        <h3>
          {{ batch.type === 'commission' ? ('transaction.restock' | translate) : 'Vorab-Kauf' }}
          &middot; {{ batch.amount | euro }}
        </h3>
        <p>
          Rest: {{ batch.remaining | euro }}
          @if (batch.type === 'commission') {
            &middot; Bonus: {{ batch.bonusPercentage }}%
            &middot; Umsatz: {{ batch.salesTotal - batch.collected | euro }}
          }
        </p>
      </ion-label>
      <ion-badge slot="end" [color]="batch.remaining > 0 ? 'warning' : 'medium'">
        {{ batch.remaining > 0 ? 'Offen' : 'Leer' }}
      </ion-badge>
    </ion-item>
  }
</ion-list>
```

- [ ] **Step 2: Update Restock action to ask for batch type**

```typescript
async onRestock(): Promise<void> {
  // First ask: commission or prepaid?
  const typeAlert = await this.alertCtrl.create({
    header: 'Posten-Typ',
    inputs: [
      { type: 'radio', label: 'Kommission', value: 'commission', checked: true },
      { type: 'radio', label: 'Vorab-Kauf', value: 'prepaid' },
    ],
    buttons: [
      { text: this.translate.instant('cancel'), role: 'cancel' },
      { text: 'Weiter', handler: (batchType: string) => this.promptRestockAmount(batchType) },
    ],
  });
  await typeAlert.present();
}

private async promptRestockAmount(batchType: string): Promise<void> {
  const alert = await this.alertCtrl.create({
    header: this.translate.instant('courier.enterAmount'),
    inputs: [{ name: 'amount', type: 'number', placeholder: '0.00' }],
    buttons: [
      { text: this.translate.instant('cancel'), role: 'cancel' },
      {
        text: this.translate.instant('save'),
        handler: async (data: { amount: string }) => {
          const amount = parseFloat(data.amount);
          if (!amount || amount <= 0) return;
          await this.agentService.createBatch(this.link()!.id, amount, batchType as any, this.link()!.bonusPercentage ?? 5);
          await this.loadData();
        },
      },
    ],
  });
  await alert.present();
}
```

- [ ] **Step 3: Update Collect/Redeem to work per-batch**

Show batch picker when collecting or redeeming:

```typescript
async onCollect(): Promise<void> {
  const batches = this.batches().filter(b => b.type === 'commission' && (b.salesTotal - b.collected) > 0);
  if (batches.length === 1) {
    await this.promptCollectAmount(batches[0]);
  } else if (batches.length > 1) {
    // Show batch picker
    const alert = await this.alertCtrl.create({
      header: 'Posten wählen',
      inputs: batches.map(b => ({
        type: 'radio' as const,
        label: `${b.amount | 0}€ — Offen: ${(b.salesTotal - b.collected).toFixed(2)}€`,
        value: b.id,
      })),
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        { text: 'Weiter', handler: (batchId: string) => {
          const batch = batches.find(b => b.id === batchId);
          if (batch) this.promptCollectAmount(batch);
        }},
      ],
    });
    await alert.present();
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/features/couriers/pages/courier-detail/
git commit -m "feat(app2): batch list + per-batch actions in courier detail page"
```

---

### Task 6: Update Agent-Dashboard to Aggregate from Batches

**Files:**
- Modify: `app2/src/app/features/dashboard/pages/agent-dashboard/agent-dashboard.page.ts`

- [ ] **Step 1: Load aggregated balances from AgentService**

Replace the direct `courier_links` query with AgentService:

```typescript
// In loadData():
const userId = this.userService.user()!.id;
const links = await this.sqlite.query<any>(
  'SELECT id FROM courier_links WHERE courier = ?', [userId]
);
if (links[0]) {
  const agg = await this.agentService.getAggregatedBalances(links[0].id);
  this.inventory.set(agg.inventory);
  this.sales.set(agg.sales);
  this.bonus.set(agg.bonus);
}
```

- [ ] **Step 2: Update dashboard agent cards similarly**

In `dashboard.page.ts`, update `loadAgentCards()` to use AgentService:

```typescript
private async loadAgentCards(): Promise<void> {
  const pairs = this.deviceService.pairs().filter(p => p.role === 'courier');
  const cards = [];
  for (const pair of pairs) {
    const remoteContacts = await this.sqlite.query<any>(
      'SELECT COUNT(*) as cnt FROM remote_contacts WHERE pairId = ?', [pair.id]
    );
    // Get agent link for this pair
    const links = await this.sqlite.query<any>(
      'SELECT id FROM courier_links WHERE courier = ?', [this.auth.user()!.id]
    );
    let inventory = 0, sales = 0, bonus = 0;
    if (links[0]) {
      const agg = await this.agentService.getAggregatedBalances(links[0].id);
      inventory = agg.inventory;
      sales = agg.sales;
      bonus = agg.bonus;
    }
    cards.push({
      pairId: pair.id,
      label: pair.label || 'Manager',
      inventory, sales, bonus,
      contactCount: remoteContacts[0]?.cnt ?? 0,
    });
  }
  this.agentCards.set(cards);
}
```

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/features/dashboard/
git commit -m "feat(app2): aggregate agent balances from batches in dashboards"
```

---

### Task 7: Add Batch Sync to EncryptedSyncService

**Files:**
- Modify: `app2/src/app/core/services/encrypted-sync.service.ts`
- Modify: `app2/src/app/core/models/sync-event.model.ts`

- [ ] **Step 1: Add 'batches' to SyncEvent table type**

```typescript
// sync-event.model.ts
export interface SyncEvent {
  action: 'upsert' | 'delete';
  table: 'contacts' | 'transactions' | 'courier_links' | 'batches';
  recordId: string;
  data: Record<string, any>;
  timestamp: string;
}
```

- [ ] **Step 2: Handle batch sync events in applySyncEvent**

In `encrypted-sync.service.ts`, add batch handling:

```typescript
case 'batches':
  if (event.action === 'upsert') {
    if (pair.role === 'courier' || pair.role === 'viewer') {
      await this.sqlite.upsert('remote_batches', { ...event.data, pairId: pair.id });
    } else {
      await this.sqlite.upsert('batches', event.data);
    }
  } else if (event.action === 'delete') {
    const table = (pair.role === 'courier' || pair.role === 'viewer') ? 'remote_batches' : 'batches';
    await this.sqlite.delete(table, event.recordId);
  }
  break;
```

- [ ] **Step 3: Include batches in syncAllContactsToPair**

When promoting to agent, also send all batches:

```typescript
async syncAllDataToPair(pair: Pair): Promise<void> {
  // Existing: sync all contacts
  await this.syncAllContactsToPair(pair);

  // NEW: sync all batches for the agent's links
  const links = await this.sqlite.query<any>(
    'SELECT id FROM courier_links WHERE courier = ?', [pair.remoteDeviceId]
  );
  for (const link of links) {
    const batches = await this.sqlite.query<any>(
      'SELECT * FROM batches WHERE agentLinkId = ?', [link.id]
    );
    for (const batch of batches) {
      await this.sendSyncEvent(pair, {
        action: 'upsert', table: 'batches', recordId: batch.id,
        data: batch, timestamp: new Date().toISOString(),
      });
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/core/services/encrypted-sync.service.ts app2/src/app/core/models/sync-event.model.ts
git commit -m "feat(app2): add batch sync support to encrypted sync service"
```

---

### Task 8: Add Translations + Final Verification

**Files:**
- Modify: `app2/src/assets/i18n/de.json`
- Modify: `app2/src/assets/i18n/en.json`

- [ ] **Step 1: Add batch translations**

```json
"batch": {
  "commission": "Kommission",
  "prepaid": "Vorab-Kauf",
  "type": "Posten-Typ",
  "remaining": "Restbestand",
  "open": "Offen",
  "empty": "Leer",
  "selectBatch": "Posten wählen",
  "openSales": "Offener Umsatz",
  "openBonus": "Offener Bonus"
}
```

- [ ] **Step 2: Full walkthrough**

1. Create a contact → make courier → set bonus %
2. Restock: choose "Kommission" → enter amount → verify batch created
3. Restock: choose "Vorab-Kauf" → enter amount → verify 2nd batch
4. Book Income for that contact → verify FIFO batch deducted
5. Collect on commission batch → verify amount
6. View courier detail → verify batch list with statuses
7. View agent dashboard → verify aggregated values

- [ ] **Step 3: Commit**

```bash
git add app2/src/assets/i18n/ app2/src/app/
git commit -m "feat(app2): phase 3 batch-based agent system complete"
```
