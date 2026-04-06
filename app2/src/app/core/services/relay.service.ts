import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import PocketBase from 'pocketbase';

function getRelayUrl(): string {
  // Must be evaluated at runtime, not build time
  if (Capacitor.isNativePlatform()) {
    return 'http://192.168.178.36:8090';
  }
  return 'http://localhost:8090';
}

@Injectable({ providedIn: 'root' })
export class RelayService {
  private pb: PocketBase;
  readonly online = signal(false);

  constructor() {
    this.pb = new PocketBase(getRelayUrl());
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
