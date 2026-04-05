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
    } catch {}
  }
}
