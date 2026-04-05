# Sync Server Setup

MoneyManager uses PocketBase as a relay server for encrypted sync messages. The server never sees unencrypted data.

## Prerequisites

- PocketBase running at http://localhost:8090
- Admin access to PocketBase dashboard

## Create the `sync_messages` collection

In PocketBase Admin UI (http://localhost:8090/_/):

1. Click "New collection"
2. Name: `sync_messages`
3. Type: Base
4. Add fields:
   - `pairId` — Text, Required
   - `sender` — Text, Required  
   - `payload` — Text, Required
5. Set API Rules (ALL public — security comes from encryption):
   - List rule: (leave empty = public)
   - View rule: (leave empty = public)
   - Create rule: (leave empty = public)
   - Delete rule: (leave empty = public)
6. Save

## How it works

- Each device has a unique ID and ECDH P-256 keypair (generated locally)
- Two devices pair via QR code scan (face-to-face key exchange)
- A shared AES-256-GCM key is derived from the key exchange
- All sync data is encrypted before being sent to this collection
- The server stores only encrypted blobs in the `payload` field
- `pairId` is a SHA-256 hash of both device IDs (no user info)
- Messages are deleted after the recipient processes them

## Security

- No user accounts on the server
- No cleartext data ever leaves the device
- The relay server cannot read any synced content
- Compromising the server yields only encrypted blobs
- Each device pair has a unique encryption key
