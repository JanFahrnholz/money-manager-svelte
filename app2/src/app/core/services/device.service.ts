import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { CryptoService } from './crypto.service';
import type { Pair } from '../models/pair.model';

interface DeviceIdentity {
  id: string;
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  readonly deviceId = signal('');
  readonly pairs = signal<Pair[]>([]);
  private identity: DeviceIdentity | null = null;

  constructor(private sqlite: SqliteService, private crypto: CryptoService) {}

  async init(): Promise<void> {
    const rows = await this.sqlite.query<{ id: string; publicKey: string; privateKey: string }>(
      'SELECT * FROM device LIMIT 1',
    );

    if (rows.length > 0) {
      this.identity = {
        id: rows[0].id,
        publicKey: JSON.parse(rows[0].publicKey),
        privateKey: JSON.parse(rows[0].privateKey),
      };
    } else {
      const { publicKey, privateKey } = await this.crypto.generateKeyPair();
      const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
      this.identity = { id, publicKey, privateKey };
      await this.sqlite.run(
        'INSERT INTO device (id, publicKey, privateKey, created) VALUES (?, ?, ?, ?)',
        [id, JSON.stringify(publicKey), JSON.stringify(privateKey), new Date().toISOString()],
      );
    }

    this.deviceId.set(this.identity.id);
    await this.loadPairs();
  }

  getPublicKeyJwk(): JsonWebKey {
    return this.identity!.publicKey;
  }

  getPrivateKeyJwk(): JsonWebKey {
    return this.identity!.privateKey;
  }

  generateQrPayload(contactId: string, contactName: string, ownerName: string): string {
    return JSON.stringify({
      deviceId: this.identity!.id,
      publicKey: this.identity!.publicKey,
      contactId,
      contactName,
      ownerName,
    });
  }

  async createPair(
    localContactId: string,
    remoteDeviceId: string,
    remotePublicKeyJwk: JsonWebKey,
    label: string,
    role: string = '',
    remoteContactId: string = '',
  ): Promise<Pair> {
    const sharedKey = await this.crypto.deriveSharedKey(this.identity!.privateKey, remotePublicKeyJwk);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
    const pair: Pair = {
      id,
      localContactId,
      remoteDeviceId,
      remotePublicKey: JSON.stringify(remotePublicKeyJwk),
      sharedKey,
      label,
      role,
      remoteContactId,
      created: new Date().toISOString(),
    };
    await this.sqlite.upsert('pairs', pair);
    this.pairs.update(list => [...list, pair]);
    return pair;
  }

  async removePair(id: string): Promise<void> {
    await this.sqlite.delete('pairs', id);
    this.pairs.update(list => list.filter(p => p.id !== id));
  }

  async updatePairRole(pairId: string, newRole: string): Promise<void> {
    await this.sqlite.run("UPDATE pairs SET role = ? WHERE id = ?", [newRole, pairId]);
    this.pairs.update(list => list.map(p => p.id === pairId ? { ...p, role: newRole } : p));
  }

  getPairForContact(contactId: string): Pair | undefined {
    return this.pairs().find(p => p.localContactId === contactId);
  }

  private async loadPairs(): Promise<void> {
    const rows = await this.sqlite.getAll<Pair>('pairs', 'created DESC');
    this.pairs.set(rows);
  }
}
