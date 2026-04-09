import { Injectable } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { CryptoService } from './crypto.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class BackupService {

  constructor(
    private sqlite: SqliteService,
    private crypto: CryptoService,
    private toast: ToastService,
  ) {}

  async exportData(password: string): Promise<string> {
    const contacts = await this.sqlite.getAll<any>('contacts');
    const transactions = await this.sqlite.getAll<any>('transactions');
    const courierLinks = await this.sqlite.getAll<any>('courier_links');
    const batches = await this.sqlite.getAll<any>('batches');
    const users = await this.sqlite.getAll<any>('users');
    const statistics = await this.sqlite.getAll<any>('statistics');

    const data = JSON.stringify({
      version: 2,
      exported: new Date().toISOString(),
      contacts,
      transactions,
      courierLinks,
      batches,
      users,
      statistics,
    });

    // Derive encryption key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new TextEncoder().encode('MoneyManager-Backup'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt'],
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(data),
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  async importData(encryptedBase64: string, password: string): Promise<void> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: new TextEncoder().encode('MoneyManager-Backup'), iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const data = JSON.parse(new TextDecoder().decode(decrypted));

    if (data.version !== 2) throw new Error('Unsupported backup version');

    for (const c of data.contacts || []) await this.sqlite.upsert('contacts', c);
    for (const t of data.transactions || []) await this.sqlite.upsert('transactions', t);
    for (const l of data.courierLinks || []) await this.sqlite.upsert('courier_links', l);
    for (const b of data.batches || []) await this.sqlite.upsert('batches', b);
    for (const s of data.statistics || []) await this.sqlite.upsert('statistics', s);
    if (data.users?.[0]) await this.sqlite.upsert('users', data.users[0]);

    this.toast.success('Backup importiert');
  }
}
