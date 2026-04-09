# Phases 4-6: Security, Products, Chat — Implementation Outlines

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Note:** These phases depend on Phase 1-3 being complete. They are outlined at task level with file paths but lighter on code blocks. Each phase should get its own detailed plan when Phase 3 is done.

---

## Phase 4: Security & UX

**Goal:** PIN/Biometrie app lock, SQLCipher DB encryption, encrypted export/backup, push notifications, multi-device support.

**Depends on:** Phase 1-3 completed

---

### Task 1: PIN / Biometrie App Lock

**Files:**
- Create: `app2/src/app/core/services/auth-lock.service.ts`
- Create: `app2/src/app/core/guards/auth-lock.guard.ts`
- Modify: `app2/src/app/features/profile/pages/profile/profile.page.ts`
- Modify: `app2/src/app/app.config.ts`

- [ ] Use `@capacitor-community/biometrics` or `@capacitor/biometrics` for fingerprint/face
- [ ] Store PIN hash in SQLite (SHA-256 of PIN + device ID as salt)
- [ ] On app resume: show lock screen, require PIN or biometric
- [ ] Profile → Security settings: enable/disable PIN, set PIN, enable biometrics
- [ ] Guard on all tab routes — redirect to lock screen if locked

---

### Task 2: SQLCipher DB Encryption

**Files:**
- Modify: `app2/src/app/core/services/sqlite.service.ts`
- Modify: `app2/capacitor.config.ts`

- [ ] Enable encryption in capacitor SQLite config: `iosIsEncryption: true, androidIsEncryption: true`
- [ ] Use PIN-derived key as SQLCipher passphrase
- [ ] On first run: create unencrypted DB → after PIN setup: migrate to encrypted
- [ ] Key derivation: PBKDF2(PIN, deviceId, 100000 iterations) → SQLCipher key
- [ ] Web fallback: `@nicolo-ribaudo/chachapoly-wasm` or skip encryption on web

---

### Task 3: Encrypted Export / Backup

**Files:**
- Create: `app2/src/app/core/services/backup.service.ts`
- Modify: `app2/src/app/features/profile/pages/profile/profile.page.ts`

- [ ] Export: dump all tables to JSON → encrypt with user-chosen password (AES-256-GCM) → save as `.mmbackup` file
- [ ] Import: pick file → decrypt → validate schema → upsert all records
- [ ] Use `@capacitor/filesystem` to read/write files
- [ ] Share via `@capacitor/share` (send backup file)
- [ ] Profile → Export / Import buttons

---

### Task 4: Push Notifications (Optional)

**Files:**
- Create: `app2/src/app/core/services/push.service.ts`
- Modify: `relay/main.ts`

- [ ] Add optional push notification support to relay server
- [ ] When message arrives for a pair → check if push token registered → send push
- [ ] Use `@capacitor/push-notifications` on mobile
- [ ] Relay endpoint: `POST /push/register` (pairId, token, platform)
- [ ] Push payload: just "new message" — no content (privacy)

---

### Task 5: Multi-Device per User

**Files:**
- Modify: `app2/src/app/core/services/device.service.ts`
- Create: `app2/src/app/features/profile/pages/devices/devices.page.ts`

- [ ] Allow linking multiple devices to same user identity
- [ ] QR pairing between own devices (special "self" pair type)
- [ ] Sync all local data between own devices (bidirectional)
- [ ] Profile → Geräte → list of linked devices, add/remove
- [ ] Conflict resolution: last-write-wins with timestamp comparison

---

## Phase 5: Products & Orders

**Goal:** Product catalog per manager, order workflow (open → accepted → delivered), delivered order creates automatic transaction.

**Depends on:** Phase 1-4 completed

---

### Task 1: Product Data Model

**Files:**
- Create: `app2/src/app/core/models/product.model.ts`
- Create: `app2/src/app/core/models/order.model.ts`
- Modify: `app2/src/app/core/services/sqlite.service.ts`

- [ ] `products` table: id, name, price, unit, stock, managerId, created, updated
- [ ] `orders` table: id, contactId, agentLinkId, status (open/accepted/packaged/delivered), items (JSON), total, created, updated
- [ ] `remote_products` cache table for agents
- [ ] Product interface + Order interface

---

### Task 2: Product Catalog Page

**Files:**
- Create: `app2/src/app/features/products/pages/product-list/product-list.page.ts`
- Create: `app2/src/app/features/products/pages/product-detail/product-detail.page.ts`
- Create: `app2/src/app/features/products/services/product.service.ts`

- [ ] Product list with name, price, stock
- [ ] Create/edit/delete products
- [ ] Link to routes: `/tabs/profile/products`, `/tabs/profile/products/:id`
- [ ] Agents see synced products from `remote_products`

---

### Task 3: Order Workflow

**Files:**
- Create: `app2/src/app/features/orders/pages/order-create/order-create.page.ts`
- Create: `app2/src/app/features/orders/pages/order-list/order-list.page.ts`
- Create: `app2/src/app/features/orders/services/order.service.ts`

- [ ] Agent creates order: pick products, set quantities → status: open
- [ ] Manager accepts → status: accepted
- [ ] Manager marks packaged → status: packaged
- [ ] Agent confirms delivery → status: delivered → auto-create Income transaction
- [ ] Order status sync between manager and agent via relay
- [ ] Status transitions as sync events

---

### Task 4: Order Sync

**Files:**
- Modify: `app2/src/app/core/services/encrypted-sync.service.ts`
- Modify: `app2/src/app/core/models/sync-event.model.ts`

- [ ] Add 'products' and 'orders' to SyncEvent table types
- [ ] Manager → Agent: sync product catalog
- [ ] Agent → Manager: new order events
- [ ] Manager → Agent: order status updates
- [ ] On delivery confirmation: create transaction automatically

---

## Phase 6: Chat

**Goal:** Encrypted messages between paired devices, linked to orders.

**Depends on:** Phase 1-5 completed (or at least Phase 2 for crypto)

---

### Task 1: Chat Data Model

**Files:**
- Create: `app2/src/app/core/models/message.model.ts`
- Modify: `app2/src/app/core/services/sqlite.service.ts`

- [ ] `messages` table: id, pairId, sender, text, orderId (optional), read, created
- [ ] `remote_messages` not needed — messages are symmetric (both sides have same pair)
- [ ] Message interface

---

### Task 2: Chat Service

**Files:**
- Create: `app2/src/app/core/services/chat.service.ts`

- [ ] Send message: encrypt via Double Ratchet → relay
- [ ] Receive messages: during poll, detect `type: 'chat'` events → insert into messages table
- [ ] Mark as read
- [ ] Load messages by pairId, sorted by created

---

### Task 3: Chat UI

**Files:**
- Create: `app2/src/app/features/chat/pages/chat/chat.page.ts`
- Create: `app2/src/app/features/chat/pages/chat-list/chat-list.page.ts`

- [ ] Chat list: all pairs with last message preview + unread count
- [ ] Chat page: message bubbles (sent/received), input bar, send button
- [ ] Link from order detail to order-specific chat
- [ ] Link from linkage detail to general chat
- [ ] Routes: `/tabs/profile/chat`, `/tabs/profile/chat/:pairId`
- [ ] Optional: typing indicator via short-lived relay messages

---

### Task 4: Chat Sync

**Files:**
- Modify: `app2/src/app/core/services/encrypted-sync.service.ts`

- [ ] New sync event type: `{ type: 'chat', text, orderId?, timestamp }`
- [ ] On receive: insert into messages table, show toast or badge
- [ ] Chat messages use same Double Ratchet — no additional crypto needed
