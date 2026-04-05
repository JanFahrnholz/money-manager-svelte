import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PocketbaseService } from './pocketbase.service';
import { SqliteService } from './sqlite.service';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());

  constructor(
    private pb: PocketbaseService,
    private sqlite: SqliteService,
    private router: Router,
  ) {}

  async init(): Promise<void> {
    // If PocketBase has a valid session, use that user
    if (this.pb.isAuthenticated) {
      const record = this.pb.client.authStore.record;
      if (record) {
        const user = this.mapRecordToUser(record);
        await this.sqlite.upsert('users', user as unknown as Record<string, any>);
        this.user.set(user);
        return;
      }
    }

    // Otherwise, load or create a local-only user
    const existing = await this.sqlite.query<User>('SELECT * FROM users LIMIT 1');
    if (existing.length > 0) {
      this.user.set(existing[0]);
    } else {
      const now = new Date().toISOString();
      const localUser: User = {
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 15),
        username: 'local',
        balance: 0,
        settings: {},
        language: localStorage.getItem('language') || 'de',
        created: now,
        updated: now,
      };
      await this.sqlite.upsert('users', localUser as unknown as Record<string, any>);
      this.user.set(localUser);
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.pb.login(username, password);

    const record = this.pb.client.authStore.record;
    if (!record) return;

    const user = this.mapRecordToUser(record);
    await this.sqlite.upsert('users', user as unknown as Record<string, any>);
    this.user.set(user);
  }

  async register(username: string, password: string): Promise<void> {
    await this.pb.register(username, password);
    await this.login(username, password);
  }

  logout(): void {
    this.pb.logout();
    // Don't clear user — local user persists. Just disconnect sync.
  }

  get isSynced(): boolean {
    return this.pb.isAuthenticated;
  }

  async updateBalance(delta: number): Promise<void> {
    const user = this.user();
    if (!user) return;
    const newBalance = user.balance + delta;
    await this.sqlite.run(
      'UPDATE users SET balance = ?, updated = ?, synced = 0 WHERE id = ?',
      [newBalance, new Date().toISOString(), user.id],
    );
    this.user.set({ ...user, balance: newBalance });
  }

  private mapRecordToUser(record: Record<string, any>): User {
    return {
      id: record['id'],
      username: record['username'],
      balance: record['balance'] ?? 0,
      settings: record['settings'] ?? {},
      language: record['language'] ?? 'en',
      created: record['created'],
      updated: record['updated'],
    };
  }
}
