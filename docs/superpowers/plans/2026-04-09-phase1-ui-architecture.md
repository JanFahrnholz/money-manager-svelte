# Phase 1: UI Architecture Alignment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the existing app2 UI to the new hybrid dashboard-hub architecture: 3 tabs (Dashboard | Kontakte | Profil), flat contact list (no network cards), agent cards on dashboard, agent-dashboard as pushed page.

**Architecture:** Replace the "Network cards" tab with a flat "Kontakte" tab showing only owned contacts. Move agent-network cards from the contacts tab to the Dashboard as "Agent-Karten". Create an Agent-Dashboard pushed page accessible from dashboard cards and profile linkages.

**Tech Stack:** Angular 20, Ionic 8, Angular Signals, ngx-translate, SQLite

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `app2/src/app/features/tabs/tabs.component.ts` | Rename Network → Kontakte tab |
| Modify | `app2/src/app/features/contacts/pages/contact-list/contact-list.page.ts` | Flat contact list, remove network cards |
| Modify | `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts` | Add agent cards section |
| Create | `app2/src/app/features/dashboard/pages/agent-dashboard/agent-dashboard.page.ts` | Agent-Dashboard pushed page |
| Modify | `app2/src/app/app.routes.ts` | Simplify routes, add agent-dashboard route |
| Modify | `app2/src/app/core/models/transaction.model.ts` | Rename Invoice → Credit |
| Modify | `app2/src/app/features/transactions/services/transaction.service.ts` | Update type references |
| Modify | `app2/src/app/features/transactions/pages/transaction-create/transaction-create.page.ts` | Update type label |
| Modify | `app2/src/app/shared/pipes/transaction-type-icon.pipe.ts` | Update icon mapping |
| Modify | `app2/src/assets/i18n/de.json` | Update translations |
| Modify | `app2/src/assets/i18n/en.json` | Update translations |
| Delete | `app2/src/app/features/contacts/pages/network-contacts/network-contacts.page.ts` | Remove intermediate page |
| Modify | `app2/src/app/features/contacts/components/contact-list-item/contact-list-item.component.ts` | Fix router paths |

---

### Task 1: Rename Tab — Network → Kontakte

**Files:**
- Modify: `app2/src/app/features/tabs/tabs.component.ts`
- Modify: `app2/src/assets/i18n/de.json`
- Modify: `app2/src/assets/i18n/en.json`

- [ ] **Step 1: Update tabs component**

```typescript
// tabs.component.ts — change the middle tab
import { statsChart, people, person } from 'ionicons/icons';

// In template, replace:
//   <ion-tab-button tab="network">
//     <ion-icon name="globe-outline" />
//     <ion-label>{{ 'tabs.network' | translate }}</ion-label>
// With:
<ion-tab-button tab="contacts">
  <ion-icon name="people" />
  <ion-label>{{ 'tabs.contacts' | translate }}</ion-label>
</ion-tab-button>

// In constructor, remove globeOutline:
addIcons({ statsChart, people, person });
```

- [ ] **Step 2: Update translations**

In `de.json`, `tabs` section already has `"contacts": "Kontakte"` — no change needed.
In `en.json`, ensure `"tabs": { "contacts": "Contacts" }`.

- [ ] **Step 3: Verify tab renders correctly**

Run: `cd app2 && ng serve`
Expected: Middle tab shows "Kontakte" with people icon.

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/features/tabs/tabs.component.ts app2/src/assets/i18n/de.json app2/src/assets/i18n/en.json
git commit -m "refactor(app2): rename Network tab to Kontakte with people icon"
```

---

### Task 2: Update Routes — Simplify Contact Routes + Add Agent Dashboard

**Files:**
- Modify: `app2/src/app/app.routes.ts`

- [ ] **Step 1: Rewrite routes**

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/dashboard', pathMatch: 'full' },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.component').then(m => m.TabsComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'dashboard/agent/:pairId', loadComponent: () => import('./features/dashboard/pages/agent-dashboard/agent-dashboard.page').then(m => m.AgentDashboardPage) },
      { path: 'contacts', loadComponent: () => import('./features/contacts/pages/contact-list/contact-list.page').then(m => m.ContactListPage) },
      { path: 'contacts/:contactId', loadComponent: () => import('./features/contacts/pages/contact-detail/contact-detail.page').then(m => m.ContactDetailPage) },
      { path: 'transactions/create', loadComponent: () => import('./features/transactions/pages/transaction-create/transaction-create.page').then(m => m.TransactionCreatePage) },
      { path: 'transactions/planned', loadComponent: () => import('./features/transactions/pages/planned-list/planned-list.page').then(m => m.PlannedListPage) },
      { path: 'profile', loadComponent: () => import('./features/profile/pages/profile/profile.page').then(m => m.ProfilePage) },
      { path: 'profile/linkages', loadComponent: () => import('./features/linkages/pages/linkage-list/linkage-list.page').then(m => m.LinkageListPage) },
      { path: 'profile/linkages/:pairId', loadComponent: () => import('./features/linkages/pages/linkage-detail/linkage-detail.page').then(m => m.LinkageDetailPage) },
      { path: 'profile/courier-dashboard', loadComponent: () => import('./features/couriers/pages/courier-dashboard/courier-dashboard.page').then(m => m.CourierDashboardPage) },
      { path: 'profile/network', loadComponent: () => import('./features/couriers/pages/network-overview/network-overview.page').then(m => m.NetworkOverviewPage) },
      { path: 'profile/network/:id', loadComponent: () => import('./features/couriers/pages/courier-detail/courier-detail.page').then(m => m.CourierDetailPage) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
```

Key changes:
- `network` → `contacts` (tab route)
- `network/:networkId` removed (no more network-contacts intermediate page)
- `network/:networkId/:contactId` → `contacts/:contactId` (direct)
- Added `dashboard/agent/:pairId` for agent dashboard

- [ ] **Step 2: Verify routes compile**

Run: `cd app2 && ng build --configuration development 2>&1 | head -20`
Expected: Build succeeds (agent-dashboard page doesn't exist yet — will be created in Task 5).

Note: The agent dashboard route will fail until Task 5. Comment it out temporarily if needed.

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/app.routes.ts
git commit -m "refactor(app2): simplify routes - contacts tab, agent dashboard route"
```

---

### Task 3: Replace Contact List — Flat List, No Network Cards

**Files:**
- Modify: `app2/src/app/features/contacts/pages/contact-list/contact-list.page.ts`
- Modify: `app2/src/app/features/contacts/components/contact-list-item/contact-list-item.component.ts`

- [ ] **Step 1: Rewrite ContactListPage template**

Replace the entire template of `contact-list.page.ts` with a flat contact list:

```typescript
template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tabs.contacts' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openScanner()">
            <ion-icon name="qr-code" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [placeholder]="'search' | translate"
          (ionInput)="onSearch($event)"
          [debounce]="250"
        />
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else if (filteredContacts().length === 0 && !searchTerm()) {
        <div style="text-align:center;padding:60px 24px;">
          <div style="font-size:48px;margin-bottom:16px;">📖</div>
          <h2 style="color:#fff;margin:0 0 8px;">{{ 'contact.welcome' | translate }}</h2>
          <p style="color:#888;">{{ 'contact.welcomeHint' | translate }}</p>
        </div>
      } @else {
        <ion-list>
          @for (contact of filteredContacts(); track contact.id) {
            <app-contact-list-item [contact]="contact" />
          }
        </ion-list>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="createContact()">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal [isOpen]="showScanModal()" (didDismiss)="showScanModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Scannen</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showScanModal.set(false)">{{ 'cancel' | translate }}</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <app-qr-scanner (scanned)="onQrScanned($event)" />
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
```

- [ ] **Step 2: Update ContactListPage class**

Remove `ownContactCount`, `claims`, `debts`, `agentNetworks` computed signals. Add `searchTerm` and `filteredContacts`:

```typescript
export class ContactListPage implements OnInit {
  readonly loading = signal(true);
  readonly showScanModal = signal(false);
  readonly searchTerm = signal('');

  readonly filteredContacts = computed(() => {
    const contacts = this.contactService.contacts();
    const term = this.searchTerm().toLowerCase();
    const filtered = term
      ? contacts.filter(c => c.name.toLowerCase().includes(term))
      : contacts;
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  });

  // ... constructor stays the same

  onSearch(event: any): void {
    this.searchTerm.set(event.detail.value || '');
  }

  async createContact(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('contact.create'),
      inputs: [{ name: 'name', type: 'text', placeholder: 'Name' }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: this.translate.instant('save'),
          handler: async (data: { name: string }) => {
            if (!data.name?.trim()) return;
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            await this.contactService.create({
              id, name: data.name.trim(), linkedName: '', balance: 0,
              owner: this.auth.user()!.id, user: '', statistics: '',
              score: 0, networkId: 'own', created: now, updated: now, synced: false,
            });
            this.nav.navigateForward(['/tabs/contacts', id]);
          },
        },
      ],
    });
    await alert.present();
  }
}
```

Add `IonSearchbar` to imports array.

- [ ] **Step 3: Update ContactListItemComponent router path**

In `contact-list-item.component.ts`, update the computed routerPath:

```typescript
readonly routerPath = computed(() => ['/tabs/contacts', this.contact().id]);
```

- [ ] **Step 4: Verify flat list renders**

Run: `ng serve`
Expected: Kontakte tab shows a flat searchable list of all contacts. No network cards.

- [ ] **Step 5: Commit**

```bash
git add app2/src/app/features/contacts/
git commit -m "refactor(app2): flat contact list, remove network card grouping"
```

---

### Task 4: Update Dashboard — Fix Transaction Router Links

**Files:**
- Modify: `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts`

- [ ] **Step 1: Fix transaction routerLink**

In dashboard template, recent transactions link to the old `/tabs/network/:contactId` route. Update to new path:

```html
<!-- Replace: -->
<ion-item [routerLink]="['/tabs/network', tx.contact]" detail="true">
<!-- With: -->
<ion-item [routerLink]="['/tabs/contacts', tx.contact]" detail="true">
```

- [ ] **Step 2: Verify dashboard transaction links**

Run: `ng serve`
Expected: Clicking a recent transaction navigates to `/tabs/contacts/:contactId`.

- [ ] **Step 3: Commit**

```bash
git add app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts
git commit -m "fix(app2): update dashboard transaction links to new contacts route"
```

---

### Task 5: Add Agent Cards to Dashboard

**Files:**
- Modify: `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts`

- [ ] **Step 1: Add agent card signals and data loading**

In `DashboardPage` class, add:

```typescript
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';

// Add to constructor:
constructor(
  // ... existing deps
  private deviceService: DeviceService,
  private sqlite: SqliteService,
) { ... }

// Add signal:
readonly agentCards = signal<{ pairId: string; label: string; inventory: number; sales: number; bonus: number; contactCount: number }[]>([]);

// In loadData(), add agent card loading:
private async loadData(): Promise<void> {
  await Promise.all([
    this.contactService.loadAll(),
    this.txService.loadRecent(50).then((txs) => this.recent.set(txs)),
    this.txService.loadPlanned().then((txs) => this.planned.set(txs)),
    this.loadAgentCards(),
  ]);
}

private async loadAgentCards(): Promise<void> {
  const pairs = this.deviceService.pairs().filter(p => p.role === 'courier');
  const cards = [];
  for (const pair of pairs) {
    const remoteContacts = await this.sqlite.query<any>(
      'SELECT COUNT(*) as cnt FROM remote_contacts WHERE pairId = ?', [pair.id]
    );
    const links = await this.sqlite.query<any>(
      'SELECT inventoryBalance, salesBalance, bonusBalance FROM courier_links WHERE courier = ?',
      [this.auth.user()!.id]
    );
    const link = links[0];
    cards.push({
      pairId: pair.id,
      label: pair.label || 'Manager',
      inventory: link?.inventoryBalance ?? 0,
      sales: link?.salesBalance ?? 0,
      bonus: link?.bonusBalance ?? 0,
      contactCount: remoteContacts[0]?.cnt ?? 0,
    });
  }
  this.agentCards.set(cards);
}
```

- [ ] **Step 2: Add agent card template**

Insert after the claims/debts grid, before planned transactions:

```html
<!-- Agent Cards (only visible when user is an agent) -->
@if (agentCards().length > 0) {
  <div class="section">
    <h3 class="section-title">{{ 'courier.dashboard' | translate }}</h3>
    @for (card of agentCards(); track card.pairId) {
      <ion-card
        button
        [routerLink]="['/tabs/dashboard/agent', card.pairId]"
        class="agent-card"
      >
        <ion-card-content>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:16px;font-weight:700;color:#fff;">Agent bei {{ card.label }}</div>
              <div style="font-size:12px;color:#888;margin-top:2px;">{{ card.contactCount }} {{ 'network.contacts' | translate }}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:#888;">{{ 'courier.inventory' | translate }}</div>
              <div style="font-size:18px;font-weight:700;color:#ffd600;">{{ card.inventory | euro }}</div>
            </div>
          </div>
          <div style="display:flex;gap:16px;margin-top:10px;">
            <div>
              <div style="font-size:11px;color:#888;">{{ 'courier.sales' | translate }}</div>
              <div style="font-size:14px;font-weight:600;color:#4cd964;">{{ card.sales | euro }}</div>
            </div>
            <div>
              <div style="font-size:11px;color:#888;">{{ 'courier.bonus' | translate }}</div>
              <div style="font-size:14px;font-weight:600;color:#ff9500;">{{ card.bonus | euro }}</div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>
    }
  </div>
}
```

- [ ] **Step 3: Add agent card styles**

Add to the component styles:

```css
.agent-card {
  margin: 0 0 12px;
  --background: linear-gradient(135deg, rgba(255,214,0,0.08), rgba(255,214,0,0.02));
  border: 1px solid rgba(255,214,0,0.15);
  border-radius: 12px;
}
```

- [ ] **Step 4: Add IonCard imports**

Add `IonCard, IonCardContent` to the component's imports array.

- [ ] **Step 5: Verify agent cards render**

Run: `ng serve`
Expected: If user has courier pairs, gold-bordered agent cards appear on dashboard below claims/debts. If no courier pairs, section is hidden.

- [ ] **Step 6: Commit**

```bash
git add app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts
git commit -m "feat(app2): add agent cards to dashboard hub"
```

---

### Task 6: Create Agent-Dashboard Pushed Page

**Files:**
- Create: `app2/src/app/features/dashboard/pages/agent-dashboard/agent-dashboard.page.ts`

- [ ] **Step 1: Create the agent dashboard component**

```typescript
// agent-dashboard.page.ts
import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonBadge,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, chevronForward } from 'ionicons/icons';
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { UserService } from '../../../../core/services/user.service';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import type { Pair } from '../../../../core/models/pair.model';

interface RemoteContact {
  id: string;
  pairId: string;
  name: string;
  balance: number;
  score: number;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner, IonBadge,
    TranslateModule, EuroPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/dashboard" />
        </ion-buttons>
        <ion-title>Agent bei {{ pair()?.label || '...' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else {
        <!-- Balance Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:16px;">
          <div class="stat-card" style="border-color:rgba(255,214,0,0.3);">
            <div class="stat-label">{{ 'courier.inventory' | translate }}</div>
            <div class="stat-value" style="color:#ffd600;">{{ inventory() | euro }}</div>
          </div>
          <div class="stat-card" style="border-color:rgba(76,217,100,0.3);">
            <div class="stat-label">{{ 'courier.sales' | translate }}</div>
            <div class="stat-value" style="color:#4cd964;">{{ sales() | euro }}</div>
          </div>
          <div class="stat-card" style="border-color:rgba(255,149,0,0.3);">
            <div class="stat-label">{{ 'courier.bonus' | translate }}</div>
            <div class="stat-value" style="color:#ff9500;">{{ bonus() | euro }}</div>
          </div>
        </div>

        <!-- Manager Contacts -->
        <div style="padding:0 16px;">
          <div style="font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px;">
            {{ 'courier.managerContacts' | translate }} ({{ remoteContacts().length }})
          </div>
        </div>

        @if (remoteContacts().length === 0) {
          <div style="text-align:center;padding:32px;color:#888;">
            {{ 'courier.noContactsSynced' | translate }}
          </div>
        } @else {
          <ion-list>
            @for (rc of remoteContacts(); track rc.id) {
              <ion-item button (click)="bookIncome(rc)">
                <div slot="start" class="avatar" [style.background]="rc.balance < 0 ? 'rgba(255,59,48,0.15)' : 'rgba(76,217,100,0.15)'"
                     [style.color]="rc.balance < 0 ? '#ff3b30' : '#4cd964'">
                  {{ rc.name.charAt(0).toUpperCase() }}
                </div>
                <ion-label>
                  <h3>{{ rc.name }}</h3>
                </ion-label>
                <ion-note slot="end" [style.color]="rc.balance < 0 ? '#ff3b30' : '#4cd964'">
                  {{ rc.balance | euro }}
                </ion-note>
              </ion-item>
            }
          </ion-list>
        }
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button color="warning">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: `
    .stat-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }
    .stat-label {
      font-size: 11px;
      color: #888;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      margin-top: 2px;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
    }
  `,
})
export class AgentDashboardPage implements OnInit {
  readonly loading = signal(true);
  readonly pair = signal<Pair | null>(null);
  readonly remoteContacts = signal<RemoteContact[]>([]);
  readonly inventory = signal(0);
  readonly sales = signal(0);
  readonly bonus = signal(0);

  constructor(
    private route: ActivatedRoute,
    private deviceService: DeviceService,
    private sqlite: SqliteService,
    private userService: UserService,
    private nav: NavController,
  ) {
    addIcons({ add, chevronForward });
  }

  async ngOnInit(): Promise<void> {
    const pairId = this.route.snapshot.paramMap.get('pairId')!;
    const pair = this.deviceService.pairs().find(p => p.id === pairId) ?? null;
    this.pair.set(pair);
    await this.loadData();
    this.loading.set(false);
  }

  async doRefresh(event: any): Promise<void> {
    await this.loadData();
    event.target.complete();
  }

  private async loadData(): Promise<void> {
    const pair = this.pair();
    if (!pair) return;

    const contacts = await this.sqlite.query<RemoteContact>(
      'SELECT * FROM remote_contacts WHERE pairId = ? ORDER BY name', [pair.id]
    );
    this.remoteContacts.set(contacts);

    const userId = this.userService.user()!.id;
    const links = await this.sqlite.query<any>(
      'SELECT inventoryBalance, salesBalance, bonusBalance FROM courier_links WHERE courier = ?', [userId]
    );
    if (links[0]) {
      this.inventory.set(links[0].inventoryBalance ?? 0);
      this.sales.set(links[0].salesBalance ?? 0);
      this.bonus.set(links[0].bonusBalance ?? 0);
    }
  }

  bookIncome(contact: RemoteContact): void {
    this.nav.navigateForward(['/tabs/transactions/create'], {
      queryParams: { contactId: contact.id, contactName: contact.name },
    });
  }
}
```

- [ ] **Step 2: Uncomment the route** (if commented in Task 2)

Ensure `app.routes.ts` has:
```typescript
{ path: 'dashboard/agent/:pairId', loadComponent: () => import('./features/dashboard/pages/agent-dashboard/agent-dashboard.page').then(m => m.AgentDashboardPage) },
```

- [ ] **Step 3: Verify agent dashboard renders**

Run: `ng serve`
Navigate to `/tabs/dashboard/agent/some-pair-id`
Expected: Page shows with back button, inventory/sales/bonus cards, manager contacts list.

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/features/dashboard/pages/agent-dashboard/
git commit -m "feat(app2): create agent-dashboard pushed page"
```

---

### Task 7: Rename TransactionType Invoice → Credit

**Files:**
- Modify: `app2/src/app/core/models/transaction.model.ts`
- Modify: `app2/src/app/features/transactions/services/transaction.service.ts`
- Modify: `app2/src/app/features/transactions/pages/transaction-create/transaction-create.page.ts`
- Modify: `app2/src/app/features/dashboard/pages/dashboard/dashboard.page.ts`
- Modify: `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts`
- Modify: `app2/src/app/shared/pipes/transaction-type-icon.pipe.ts`
- Modify: `app2/src/app/features/contacts/components/stats-cards/stats-cards.component.ts`
- Modify: `app2/src/assets/i18n/de.json`
- Modify: `app2/src/assets/i18n/en.json`

- [ ] **Step 1: Update enum**

```typescript
// transaction.model.ts
export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
  Credit = 'Credit',    // was Invoice
  Refund = 'Refund',
  Restock = 'Restock',
  Collect = 'Collect',
  Redeem = 'Redeem',
}
```

- [ ] **Step 2: Find and replace all references**

Search for `TransactionType.Invoice` and `Invoice` in all .ts files under app2/src/. Replace with `TransactionType.Credit` / `Credit`.

Key files:
- `transaction.service.ts`: balance logic uses `TransactionType.Invoice` for contact balance update → change to `TransactionType.Credit`
- `transaction-create.page.ts`: type picker segment shows Invoice → change to Credit
- `dashboard.page.ts`: `txTypeKey()` maps Invoice → 'invoice' key → change to `case TransactionType.Credit: return 'credit';`
- `contact-detail.page.ts`: same txTypeKey pattern
- `stats-cards.component.ts`: references to Invoice type in calculations
- `transaction-type-icon.pipe.ts`: icon mapping for Invoice → change to Credit

- [ ] **Step 3: Update translations**

In `de.json`:
```json
"transaction": {
  "credit": "Kredit",
  // keep "invoice": "Kredit" as fallback for old data
}
```

In `en.json`:
```json
"transaction": {
  "credit": "Credit",
}
```

- [ ] **Step 4: Handle legacy data**

Existing transactions in SQLite may have `type = 'Invoice'`. Add a migration in `sqlite.service.ts`:

```typescript
// In createTables(), add:
try { await this.db.execute("UPDATE transactions SET type = 'Credit' WHERE type = 'Invoice'"); } catch {}
```

- [ ] **Step 5: Verify transaction creation with Credit type**

Run: `ng serve`
Create a new transaction → select Credit type.
Expected: Shows "Kredit" in German, saves as "Credit" in DB.

- [ ] **Step 6: Commit**

```bash
git add app2/src/app/core/models/transaction.model.ts app2/src/app/features/ app2/src/app/shared/ app2/src/assets/i18n/ app2/src/app/core/services/sqlite.service.ts
git commit -m "refactor(app2): rename Invoice → Credit transaction type"
```

---

### Task 8: Update Contact Detail Router Paths

**Files:**
- Modify: `app2/src/app/features/contacts/pages/contact-detail/contact-detail.page.ts`

- [ ] **Step 1: Update route parameter extraction**

The contact detail page currently reads `networkId` and `contactId` from the route. With the new flat routes (`/tabs/contacts/:contactId`), it only needs `contactId`:

```typescript
// In ngOnInit(), change:
// const contactId = this.route.snapshot.paramMap.get('contactId')!;
// to:
const contactId = this.route.snapshot.paramMap.get('contactId')!;
// (should already work if the param name matches)
```

Also update any `routerLink` references in the template that use the old `/tabs/network/...` paths:

```html
<!-- Replace any: -->
[routerLink]="['/tabs/network', contact()?.networkId || 'own', contact()?.id]"
<!-- With: -->
[routerLink]="['/tabs/contacts', contact()?.id]"
```

Update the "New Transaction" button link if it navigates back:
```html
[routerLink]="['/tabs/transactions/create']"
[queryParams]="{ contactId: contact()?.id }"
```

- [ ] **Step 2: Remove networkLabel computed signal**

Remove the `networkLabel` computed signal and its template reference, since contacts are no longer grouped by network.

- [ ] **Step 3: Verify contact detail page**

Run: `ng serve`
Navigate to a contact via the flat list.
Expected: Contact detail loads correctly, back button returns to contacts list.

- [ ] **Step 4: Commit**

```bash
git add app2/src/app/features/contacts/pages/contact-detail/
git commit -m "fix(app2): update contact detail routes for flat contact list"
```

---

### Task 9: Cleanup — Remove NetworkContactsPage

**Files:**
- Delete: `app2/src/app/features/contacts/pages/network-contacts/network-contacts.page.ts`

- [ ] **Step 1: Delete the file**

```bash
rm app2/src/app/features/contacts/pages/network-contacts/network-contacts.page.ts
```

- [ ] **Step 2: Verify no imports remain**

Search for `NetworkContactsPage` or `network-contacts` in all `.ts` files. Remove any remaining references (should only be in app.routes.ts, already removed in Task 2).

- [ ] **Step 3: Verify build succeeds**

Run: `cd app2 && ng build --configuration development`
Expected: No compilation errors.

- [ ] **Step 4: Commit**

```bash
git add -A app2/src/app/features/contacts/pages/network-contacts/
git commit -m "refactor(app2): remove NetworkContactsPage (replaced by flat contacts list)"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Full app walkthrough**

Run: `ng serve` and verify:
1. Tab bar shows: Dashboard | Kontakte | Profil
2. Kontakte tab shows flat searchable contact list
3. Tapping a contact opens contact detail directly (no intermediate page)
4. Dashboard shows agent cards if user has courier pairs
5. Tapping agent card opens agent dashboard
6. Back button from agent dashboard returns to dashboard
7. Transaction creation works with "Credit" type (was "Invoice")
8. Recent transactions on dashboard link to correct contact detail page
9. Profile → Verlinkungen still works

- [ ] **Step 2: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix(app2): phase 1 UI architecture alignment fixups"
```
