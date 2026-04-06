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
    // Get all contacts we own that aren't yet paired
    const contacts = await this.sqlite.getAll<any>('contacts', 'created DESC');
    const existingPairs = this.device.pairs();

    for (const contact of contacts) {
      // Skip contacts that already have a pair
      if (existingPairs.find(p => p.localContactId === contact.id)) continue;

      // For each unpaired contact, check if there's a pairing request from any device
      // We check all possible pairIds by looking at sync_messages with our deviceId in the pairId
      // Since we don't know the remote deviceId, we fetch ALL messages and try to parse as pairing requests
    }

    // Simpler approach: fetch ALL messages where we're NOT the sender, try to parse as pairing request
    try {
      const allMessages = await this.relay.fetchAll(this.device.deviceId());
      for (const msg of allMessages) {
        try {
          const data = JSON.parse(msg.payload);
          if (data.type === 'pairing_request' && data.forContactId) {
            console.log('[EncryptedSync] received pairing request for contact:', data.forContactId);

            // Check if we own this contact
            const contact = await this.sqlite.getById<any>('contacts', data.forContactId);
            if (!contact) { await this.relay.deleteMessage(msg.id); continue; }

            // Check if already paired
            const existingPair = existingPairs.find(p => p.localContactId === data.forContactId);
            if (existingPair) { await this.relay.deleteMessage(msg.id); continue; }

            // Create pair on our side
            await this.device.createPair(data.forContactId, data.fromDeviceId, data.fromPublicKey, data.mirrorContactName || '');

            // Update contact with remote deviceId
            await this.sqlite.run(
              "UPDATE contacts SET user = ?, linkedName = ?, updated = ?, synced = 0 WHERE id = ?",
              [data.fromDeviceId, data.mirrorContactName || '', new Date().toISOString(), data.forContactId]
            );

            console.log('[EncryptedSync] pair created for contact:', data.forContactId);
            await this.relay.deleteMessage(msg.id);
          }
        } catch {
          // Not a pairing request — ignore (might be encrypted sync data for a pair we don't have yet)
        }
      }
    } catch (e) {
      console.error('[EncryptedSync] polling pairing requests failed:', e);
    }
  }

  private async applySyncEvent(event: SyncEvent): Promise<void> {
    if (event.action === 'delete') {
      await this.sqlite.delete(event.table, event.recordId);
      return;
    }

    const existing = await this.sqlite.getById<any>(event.table, event.recordId);
    if (existing && existing['updated'] > event.timestamp) return;

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
