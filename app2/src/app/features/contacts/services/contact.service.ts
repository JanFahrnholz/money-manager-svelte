import { Injectable, computed, signal } from '@angular/core';
import { SqliteService } from '../../../core/services/sqlite.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Contact } from '../../../core/models/contact.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  readonly contacts = signal<Contact[]>([]);

  readonly owned = computed(() => {
    const userId = this.auth.user()?.id;
    if (!userId) return [];
    return this.contacts().filter((c) => c.owner === userId && !c.user);
  });

  readonly linked = computed(() => {
    const userId = this.auth.user()?.id;
    if (!userId) return [];
    return this.contacts().filter((c) => c.user === userId && c.owner !== userId);
  });

  constructor(
    private sqlite: SqliteService,
    private auth: AuthService,
  ) {}

  async loadAll(): Promise<void> {
    const rows = await this.sqlite.getAll<Contact>('contacts', 'name ASC');
    this.contacts.set(rows);
  }

  async getById(id: string): Promise<Contact | null> {
    return this.sqlite.getById<Contact>('contacts', id);
  }

  async create(name: string, user?: string): Promise<Contact> {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
    const now = new Date().toISOString();
    const owner = this.auth.user()?.id ?? '';

    const contact: Contact = {
      id,
      name,
      linkedName: '',
      balance: 0,
      owner,
      user: user ?? '',
      statistics: '',
      score: 0,
      created: now,
      updated: now,
      synced: false,
    };

    await this.sqlite.upsert('contacts', {
      ...contact,
      synced: 0,
    });

    this.contacts.update((list) => [...list, contact]);
    return contact;
  }

  async update(id: string, data: Partial<Contact>): Promise<void> {
    const now = new Date().toISOString();
    await this.sqlite.upsert('contacts', {
      id,
      ...data,
      updated: now,
      synced: 0,
    });

    this.contacts.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...data, updated: now } : c)),
    );
  }

  async remove(id: string): Promise<void> {
    await this.sqlite.delete('contacts', id);
    this.contacts.update((list) => list.filter((c) => c.id !== id));
  }
}
