import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { PocketbaseService } from './pocketbase.service';

const SYNC_COLLECTIONS = ['contacts', 'transactions', 'courier_links'];

@Injectable({ providedIn: 'root' })
export class SyncService {
  readonly syncing = signal(false);
  readonly lastSync = signal<string | null>(null);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private sqlite: SqliteService,
    private pb: PocketbaseService,
  ) {}

  async syncAll(): Promise<void> {
    if (!this.pb.online() || !this.pb.isAuthenticated || this.syncing()) return;

    this.syncing.set(true);
    try {
      for (const collection of SYNC_COLLECTIONS) {
        await this.pushLocal(collection);
        await this.pullRemote(collection);
      }
      this.lastSync.set(new Date().toISOString());
    } finally {
      this.syncing.set(false);
    }
  }

  private async pushLocal(collection: string): Promise<void> {
    const unsynced = await this.sqlite.query<Record<string, any>>(
      `SELECT * FROM ${collection} WHERE synced = 0`,
    );

    for (const record of unsynced) {
      try {
        const { synced, ...data } = record;
        try {
          await this.pb.client.collection(collection).update(data['id'], data);
        } catch {
          await this.pb.client.collection(collection).create(data);
        }
        await this.sqlite.run(`UPDATE ${collection} SET synced = 1 WHERE id = ?`, [data['id']]);
      } catch (err) {
        console.error(`[Sync] push failed for ${collection}/${record['id']}:`, err);
      }
    }
  }

  private async pullRemote(collection: string): Promise<void> {
    try {
      const last = this.lastSync();
      const filter = last ? `updated > "${last}"` : '';
      const records = await this.pb.client.collection(collection).getFullList({ filter });

      for (const record of records) {
        try {
          const { expand, collectionId, collectionName, ...data } = record as Record<string, any>;
          await this.sqlite.upsert(collection, { ...data, synced: 1 });
        } catch (err) {
          console.error(`[Sync] pull upsert failed for ${collection}/${record['id']}:`, err);
        }
      }
    } catch (err) {
      console.error(`[Sync] pull failed for ${collection}:`, err);
    }
  }

  startPeriodicSync(intervalMs = 30_000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.syncAll(), intervalMs);
  }
}
