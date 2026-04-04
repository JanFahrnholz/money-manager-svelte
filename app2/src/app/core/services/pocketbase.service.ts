import { Injectable, signal } from '@angular/core';
import PocketBase from 'pocketbase';

@Injectable({ providedIn: 'root' })
export class PocketbaseService {
  private pb = new PocketBase('http://localhost:8090');

  readonly online = signal(false);

  constructor() {
    this.pb.autoCancellation(false);
  }

  get client(): PocketBase {
    return this.pb;
  }

  get userId(): string | undefined {
    return this.pb.authStore.record?.['id'];
  }

  get isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  async checkConnection(): Promise<void> {
    try {
      await this.pb.health.check();
      this.online.set(true);
    } catch {
      this.online.set(false);
    }
  }

  async login(username: string, password: string): Promise<void> {
    await this.pb.collection('users').authWithPassword(username, password);
  }

  async register(username: string, password: string): Promise<void> {
    await this.pb.collection('users').create({ username, password, passwordConfirm: password });
    await this.login(username, password);
  }

  logout(): void {
    this.pb.authStore.clear();
  }
}
