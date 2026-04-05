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
