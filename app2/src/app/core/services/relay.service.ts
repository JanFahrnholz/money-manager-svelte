import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

function getDefaultRelayUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return 'http://192.168.178.36:8090';
  }
  return 'http://localhost:8090';
}

@Injectable({ providedIn: 'root' })
export class RelayService {
  readonly online = signal(false);
  private relayUrl: string;

  constructor() {
    this.relayUrl = localStorage.getItem('relayUrl') || getDefaultRelayUrl();
    this.checkConnection();
  }

  setRelayUrl(url: string): void {
    this.relayUrl = url.replace(/\/$/, '');
    localStorage.setItem('relayUrl', this.relayUrl);
  }

  getUrl(): string {
    return this.relayUrl;
  }

  async checkConnection(): Promise<void> {
    try {
      const res = await fetch(`${this.relayUrl}/health`);
      this.online.set(res.ok);
    } catch {
      this.online.set(false);
    }
  }

  async send(pairId: string, sender: string, payload: string): Promise<void> {
    await fetch(`${this.relayUrl}/messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairId, sender, payload }),
    });
  }

  async fetch(pairId: string, excludeSender: string): Promise<{ id: string; payload: string; created: string }[]> {
    try {
      const params = new URLSearchParams({ pair: pairId });
      if (excludeSender) params.set('exclude', excludeSender);
      const res = await fetch(`${this.relayUrl}/messages?${params}`);
      return res.json();
    } catch {
      return [];
    }
  }

  async fetchAll(excludeSender: string): Promise<{ id: string; pairId: string; payload: string; created: string }[]> {
    // New relay requires per-pair fetch — this is handled by EncryptedSyncService.pollAll()
    // Kept for interface compat but returns empty
    return [];
  }

  async deleteMessage(id: string, pairId: string): Promise<void> {
    try {
      await fetch(`${this.relayUrl}/messages/${id}?pair=${pairId}`, { method: 'DELETE' });
    } catch {}
  }
}
