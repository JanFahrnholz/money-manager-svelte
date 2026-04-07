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

  async sendRoleUpgrade(pair: Pair, newRole: string, courierData: Record<string, any> = {}): Promise<void> {
    if (!this.relay.online()) return;
    try {
      const payload = JSON.stringify({
        type: 'role_upgrade',
        newRole,
        courierData,
        timestamp: new Date().toISOString(),
      });
      const encrypted = await this.crypto.encrypt(pair.sharedKey, payload);
      const pairId = await this.crypto.hashPairId(this.device.deviceId(), pair.remoteDeviceId);
      await this.relay.send(pairId, this.device.deviceId(), encrypted);
      console.log('[Sync] role upgrade sent:', newRole);

      // After sending role upgrade, also push all contacts
      await this.syncAllContactsToPair(pair);
    } catch (e) {
      console.error('[Sync] role upgrade send failed:', e);
    }
  }

  async syncAllContactsToPair(pair: Pair): Promise<void> {
    const contacts = await this.sqlite.getAll<any>('contacts', 'name ASC');
    for (const contact of contacts) {
      const event: SyncEvent = {
        action: 'upsert',
        table: 'contacts',
        recordId: contact.id,
        data: contact,
        timestamp: new Date().toISOString(),
      };
      await this.sendSyncEvent(pair, event);
    }
    console.log('[Sync] pushed', contacts.length, 'contacts to courier');
  }

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
      if (table === 'transactions') {
        if (pair.localContactId === contactId) shouldSync = true;
        // Courier syncs all transactions to manager
        if (pair.role === 'courier') shouldSync = true;
      }
      if (table === 'courier_links') {
        // Sync courier_link changes to all pairs for now; can be optimized later
        shouldSync = true;
      }

      if (shouldSync) {
        const event: SyncEvent = { action, table: table as SyncEvent['table'], recordId, data, timestamp: new Date().toISOString() };
        await this.sendSyncEvent(pair, event);
      }
    }
  }

  /**
   * Send a pairing request so the QR-displayer can create its own pair.
   * This is sent as a plaintext JSON (not encrypted) because the pair doesn't exist yet on the other side.
   */
  async sendPairingRequest(remoteDeviceId: string, remoteContactId: string, localContactId: string, localContactName: string): Promise<void> {
    if (!this.relay.online()) return;
    try {
      const pairId = await this.crypto.hashPairId(this.device.deviceId(), remoteDeviceId);
      const payload = JSON.stringify({
        type: 'pairing_request',
        fromDeviceId: this.device.deviceId(),
        fromPublicKey: this.device.getPublicKeyJwk(),
        forContactId: remoteContactId,
        mirrorContactId: localContactId,
        mirrorContactName: localContactName,
      });
      await this.relay.send(pairId, this.device.deviceId(), payload);
      console.log('[EncryptedSync] pairing request sent');
    } catch (e) {
      console.error('[EncryptedSync] pairing request failed:', e);
    }
  }

  async pollAll(): Promise<void> {
    if (this.syncing() || !this.relay.online()) return;
    this.syncing.set(true);

    try {
      // 1. Check for pairing requests (unencrypted messages for contacts we own but haven't paired yet)
      await this.pollPairingRequests();

      // 2. Poll encrypted sync messages for existing pairs
      const pairs = this.device.pairs();
      console.log('[Sync] pollAll, pairs:', pairs.length);
      for (const pair of pairs) {
        const pairId = await this.crypto.hashPairId(this.device.deviceId(), pair.remoteDeviceId);
        const messages = await this.relay.fetch(pairId, this.device.deviceId());

        for (const msg of messages) {
          try {
            const json = await this.crypto.decrypt(pair.sharedKey, msg.payload);
            const parsed = JSON.parse(json);

            if (parsed.type === 'role_upgrade') {
              console.log('[Sync] received role upgrade:', parsed.newRole);
              await this.handleRoleUpgrade(pair, parsed);
              await this.relay.deleteMessage(msg.id);
              continue;
            }

            const event: SyncEvent = parsed;
            await this.applySyncEvent(event, pair);
            await this.relay.deleteMessage(msg.id);
          } catch (e) {
            // Might be a pairing request (plaintext) that we already processed — just delete
            await this.relay.deleteMessage(msg.id);
          }
        }
      }
    } finally {
      this.syncing.set(false);
    }
  }

  private async pollPairingRequests(): Promise<void> {
    try {
      const allMessages = await this.relay.fetchAll(this.device.deviceId());
      console.log('[Sync] polling pairing requests, messages:', allMessages.length);

      for (const msg of allMessages) {
        try {
          const data = JSON.parse(msg.payload);
          if (data.type !== 'pairing_request') continue;

          console.log('[Sync] pairing request for contact:', data.forContactId);

          const contact = await this.sqlite.getById<any>('contacts', data.forContactId);
          if (!contact) {
            console.log('[Sync] contact not found, deleting message');
            await this.relay.deleteMessage(msg.id);
            continue;
          }

          const existingPair = this.device.getPairForContact(data.forContactId);
          if (existingPair) {
            console.log('[Sync] already paired, deleting message');
            await this.relay.deleteMessage(msg.id);
            continue;
          }

          await this.device.createPair(data.forContactId, data.fromDeviceId, data.fromPublicKey, data.mirrorContactName || '');

          await this.sqlite.run(
            "UPDATE contacts SET user = ?, linkedName = ?, updated = ?, synced = 0 WHERE id = ?",
            [data.fromDeviceId, data.mirrorContactName || '', new Date().toISOString(), data.forContactId]
          );

          console.log('[Sync] pair created successfully for:', data.forContactId);
          await this.relay.deleteMessage(msg.id);
        } catch {
          // Not a valid pairing request JSON — skip
        }
      }
    } catch (e) {
      console.error('[Sync] pollPairingRequests error:', e);
    }
  }

  private async handleRoleUpgrade(pair: Pair, data: { newRole: string; courierData?: Record<string, any> }): Promise<void> {
    await this.device.updatePairRole(pair.id, data.newRole);
    console.log('[Sync] pair role updated to:', data.newRole);
  }

  private async applySyncEvent(event: SyncEvent, pair: Pair): Promise<void> {
    const isViewer = pair.role === 'viewer';
    console.log(`[Sync] applying event: table=${event.table}, action=${event.action}, pair.role=${pair.role || 'owner'}`);

    if (event.action === 'delete') {
      if (event.table === 'courier_links') {
        await this.sqlite.delete('courier_links', event.recordId);
        console.log('[Sync] deleted courier_link');
      } else if (isViewer) {
        if (event.table === 'contacts') await this.sqlite.delete('remote_contacts', event.recordId);
        if (event.table === 'transactions') await this.sqlite.delete('remote_transactions', event.recordId);
        console.log(`[Sync] deleted from remote_${event.table} cache`);
      } else {
        await this.sqlite.delete(event.table, event.recordId);
      }
      return;
    }

    // courier_links are always stored locally (not in remote cache), regardless of role
    if (event.table === 'courier_links') {
      const { synced, ...data } = event.data;
      await this.sqlite.upsert('courier_links', { ...data, id: event.recordId, synced: 1 });
      console.log('[Sync] updated local courier_link from manager');
      return;
    }

    if (isViewer) {
      const { synced, ...data } = event.data;
      if (event.table === 'contacts') {
        await this.sqlite.upsert('remote_contacts', { ...data, id: event.recordId, pairId: pair.id });
        console.log('[Sync] stored in remote_contacts cache');
      } else if (event.table === 'transactions') {
        await this.sqlite.upsert('remote_transactions', { ...data, id: event.recordId, pairId: pair.id });
        console.log('[Sync] stored in remote_transactions cache');
      }
    } else {
      // Incoming transactions from paired devices go to remote cache
      if (event.table === 'transactions') {
        const { synced, ...data } = event.data;
        await this.sqlite.upsert('remote_transactions', { ...data, id: event.recordId, pairId: pair.id });
        console.log('[Sync] stored incoming transaction in remote_transactions');

        // Forward up the chain if we are also a courier for someone else
        const courierPairs = this.device.pairs().filter(p => p.role === 'courier');
        for (const cp of courierPairs) {
          // Don't forward back to the sender
          if (cp.remoteDeviceId === pair.remoteDeviceId) continue;
          await this.sendSyncEvent(cp, event);
          console.log('[Sync] forwarded transaction up chain to:', cp.label);
        }

        return;
      }

      const existing = await this.sqlite.getById<any>(event.table, event.recordId);
      if (existing && existing['updated'] > event.timestamp) return;

      const { synced, ...data } = event.data;
      await this.sqlite.upsert(event.table, { ...data, id: event.recordId, synced: 1 });
    }
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
