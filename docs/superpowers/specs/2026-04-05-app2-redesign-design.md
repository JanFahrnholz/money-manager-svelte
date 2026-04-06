# MoneyManager App2 — Design Spec

## Context

Rebuild of the MoneyManager PWA. The current app (`app/`) uses Svelte 4 + Framework7 and has fragile code, no offline support, and an unclear courier UX. App2 is a greenfield rewrite with a rethought UX, a cleaner architecture, and offline-first data storage.

## Stack

- **Frontend:** Angular 20 + Ionic 8 + Capacitor 7
- **Backend:** PocketBase (self-hosted, existing)
- **Local DB:** SQLite via `@capacitor-community/sqlite`
- **State:** Angular Signals + Services
- **Auth:** PocketBase username/password auth
- **i18n:** DE/EN (ngx-translate or Angular i18n)
- **Target:** PWA + Native (iOS/Android) equally

## Architecture

### Offline-First

```
┌─────────────┐       ┌──────────────┐
│  Ionic App  │       │  PocketBase  │
│             │ sync  │  (self-host) │
│  SQLite DB  │◄─────►│  Auth + Data │
│  (lokal)    │       │              │
└─────────────┘       └──────────────┘
```

- App reads/writes against local SQLite always
- Background sync service syncs with PocketBase when online
- Conflict resolution: last-write-wins with timestamps
- Auth: login against PocketBase, token stored locally
- PocketBase Realtime API for push updates when online

### Frontend Structure

```
src/app/
  core/              — PocketBase client, Auth guard, Sync service, SQLite service
  shared/            — Timeframe selector, Numpad, Pipes, Directives
  features/
    dashboard/       — Dashboard tab
    contacts/        — Contacts tab + detail pages
    profile/         — Profile/settings tab
    transactions/    — Transaction create modal (no own tab)
    couriers/        — Courier network (Phase 2)
    products/        — Product catalog (Phase 3)
    orders/          — Orders (Phase 3)
    chat/            — Chat (Phase 4)
```

Each feature module: `pages/`, `components/`, `services/`, `models/`.

## Data Model

### Phase 1 Collections

**users** (auth)
- id, username, password, balance, settings (JSON), language

**contacts** (base)
- id, name, linkedName, balance, owner→user, user→user?, statistics→statistics
- List rule: owner OR linked user OR owner's courier network

**transactions** (base)
- id, amount, info, date, type (select: Income, Expense, Invoice, Refund, Restock, Collect, Redeem), contact→contact, owner→user, courierLink→courier_links?
- Types stored in English only. Frontend displays localized via i18n.

**planned_transactions** (base)
- Same fields as transactions

**statistics** (base)
- id, balanceHistory (JSON array of {date, balance})

### Phase 2 Collections

**courier_links** (base) — replaces `couriers` collection
- id, manager→user, courier→user
- inventoryBalance, salesBalance, bonusBalance, bonusPercentage, totalSales

Multi-level: User A manages B (courier_links: manager=A, courier=B), B manages C (manager=B, courier=C). A sees full chain recursively.

### Phase 3 Collections

**products** (base)
- id, name, description, price, stock, unit, owner→user, divisible, disabled

**orders** (base)
- id, product (JSON), contact→contact, quantity, status (open/accepted/declined/packaged/delivered/canceled), payDirectly, when, location

### Phase 4 Collections

**chats** (base)
- id, participants→users[], messages (JSON)

### Migration from current DB

- Transaction types: `UPDATE transactions SET type='Income' WHERE type='Einnahme'` (same for Ausgabe→Expense, Rechnung→Invoice, Rückzahlung→Refund)
- `couriers` collection → migrate to `courier_links`
- `users.couriers` relation field → remove (replaced by courier_links)
- `contacts.courier` relation → remove (contact linked via courier_links)
- `profiles` collection → merge into `users.settings`

## Navigation

3 bottom tabs: **Dashboard · Kontakte · Profil**

Transactions are always created from a contact context (contact detail → new transaction modal). No dedicated transactions tab.

## Screens

### Tab 1: Dashboard

- Timeframe selector at top (1W · 1M · 3M · 6M · 1J · Max) — filters all data below
- User balance (large, centered, gold)
- Two cards: Forderungen (green) + Schulden (red) — sum of positive/negative contact balances within timeframe
- Recent transactions list (within timeframe)
- Planned transactions with confirm button

### Tab 2: Contacts

- Search bar
- Filter chips: Alle · Eigene · Verlinkt · Kuriere
- Contact list: avatar (color by balance), name, score, balance
- Linked contacts show 🔗, couriers show role badge
- FAB button (+) for new contact

### Contact Detail Page

- Header: avatar, name, balance (large), score
- Action button: + Transaktion
- Timeframe selector (1W · 1M · 3M · 6M · 1J · Max) — filters graph, stats, and transaction list
- Balance history graph (SVG line chart with gradient fill, date labels on x-axis)
- 4 stats cards: Einnahmen (sum + count), Ausgaben, offene Rechnungen, Score (with trend)
- Transaction history list with info text, "load more"

### Transaction Create (Modal)

- Opened from contact detail
- Contact pre-selected (shown below amount)
- Large amount display
- Segment buttons for type: Einnahme · Ausgabe · Rechnung · Rückzahlung (courier types when applicable)
- Info text field (optional)
- Planned toggle
- Numpad

### Tab 3: Profile

- User info
- Language selector (DE/EN)
- Settings
- Link to "Mein Netzwerk" (Phase 2)
- Sync status indicator
- Logout

### Courier Network (Phase 2)

**Network Overview** (from profile tab):
- Summary cards: courier count, total inventory, open revenue
- Tree view: visual hierarchy with indented levels, each node shows name + inventory/sales/bonus
- "Invite courier" button

**Courier Detail (Manager view):**
- 3 balance cards: Inventar, Umsatz, Bonus
- Progress bar (sales/inventory ratio)
- 3 action buttons: Aufstocken (Restock), Abkassieren (Collect), Bonus einlösen (Redeem)
- Editable bonus percentage
- Total sales
- Sub-couriers list

**Courier Dashboard (Courier's own view):**
- Manager info card
- Own balances (inventory, sales, bonus)
- Progress bar
- Contact list (manager's + own contacts) with "Verkaufen →" action
- Own sub-couriers list

### Products & Orders (Phase 3)

**Product Catalog:**
- List with name, price, stock, unit
- Create/edit product form
- Disable/enable toggle

**Orders:**
- Create order from contact context
- Status workflow: open → accepted → packaged → delivered (or declined/canceled)
- Order detail: product, quantity, location, time, pay-directly toggle
- Delivered order → creates transaction automatically

### Chat (Phase 4)

- Chat list: participants, last message preview
- Chat detail: message thread
- Linked to orders (one chat per order)
- PocketBase Realtime for live updates

## Phases

### Phase 1: Core
- Ionic + Angular project setup (replace Framework7)
- PocketBase client + SQLite offline layer + sync service
- Auth (login/register)
- Dashboard with timeframe selector
- Contacts: list, detail, create/edit/delete
- Contact detail: balance graph with timeframe, stats cards, transaction history
- Transaction create modal with numpad
- Profile: settings, language, logout
- DB migration script (German types → English)

### Phase 2: Courier Network
- `courier_links` collection + migration from `couriers`
- Network overview with tree view
- Courier detail (manager actions: restock, collect, redeem)
- Courier dashboard (courier view: sell to contacts)
- Multi-level support (sub-couriers, recursive tree traversal)
- Courier transaction types in create modal

### Phase 3: Products & Orders
- Product catalog CRUD
- Order creation from contact
- Order status workflow
- Order → transaction integration on delivery

### Phase 4: Chat
- Chat list + detail
- Order-linked chats
- PocketBase Realtime push

## Design Language

- Dark mode default (background #1a1a1a)
- Primary color: #ffd600 (gold)
- Positive: #4cd964 (green)
- Negative: #ff3b30 (red)
- Warning/bonus: #ff9500 (orange)
- Neutral: #888
- Cards: #222 with 12px border-radius
- iOS theme (Ionic default)
- Avatar colors derived from contact balance (green/red/gold)
