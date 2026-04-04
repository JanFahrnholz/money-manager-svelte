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
    if (!this.pb.isAuthenticated) return;

    const record = this.pb.client.authStore.record;
    if (!record) return;

    const user = this.mapRecordToUser(record);
    await this.sqlite.upsert('users', user as unknown as Record<string, any>);
    this.user.set(user);
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
    this.user.set(null);
    this.router.navigate(['/auth/login']);
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
