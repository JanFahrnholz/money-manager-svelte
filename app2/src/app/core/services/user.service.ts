import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import type { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  readonly user = signal<User | null>(null);

  constructor(private sqlite: SqliteService) {}

  async init(): Promise<void> {
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
      await this.sqlite.upsert('users', { ...localUser, settings: JSON.stringify(localUser.settings) });
      this.user.set(localUser);
    }
  }

  async updateBalance(delta: number): Promise<void> {
    const user = this.user();
    if (!user) return;
    const newBalance = user.balance + delta;
    await this.sqlite.run(
      'UPDATE users SET balance = ?, updated = ? WHERE id = ?',
      [newBalance, new Date().toISOString(), user.id],
    );
    this.user.set({ ...user, balance: newBalance });
  }

  async updateSettings(settings: Record<string, any>): Promise<void> {
    const user = this.user();
    if (!user) return;
    const merged = { ...user.settings, ...settings };
    await this.sqlite.run(
      'UPDATE users SET settings = ?, updated = ? WHERE id = ?',
      [JSON.stringify(merged), new Date().toISOString(), user.id],
    );
    this.user.set({ ...user, settings: merged });
  }
}
