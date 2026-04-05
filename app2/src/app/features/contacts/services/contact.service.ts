import { Injectable, computed, signal } from '@angular/core';
import { SqliteService } from '../../../core/services/sqlite.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
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
    private auth: UserService,
    private toast: ToastService,
  ) {}

  async loadAll(): Promise<void> {
    const rows = await this.sqlite.getAll<Contact>('contacts', 'name ASC');
    this.contacts.set(rows);
  }

  async getById(id: string): Promise<Contact | null> {
    return this.sqlite.getById<Contact>('contacts', id);
  }

  async create(name: string, user?: string): Promise<Contact> {
    try {
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
      this.toast.success('Kontakt erstellt');
      return contact;
    } catch (e: any) {
      this.toast.error('Fehler: ' + e.message);
      throw e;
    }
  }

  async update(id: string, data: Partial<Contact>): Promise<void> {
    try {
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
      this.toast.success('Kontakt aktualisiert');
    } catch (e: any) {
      this.toast.error('Fehler: ' + e.message);
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.sqlite.delete('contacts', id);
      this.contacts.update((list) => list.filter((c) => c.id !== id));
      this.toast.success('Kontakt gelöscht');
    } catch (e: any) {
      this.toast.error('Fehler: ' + e.message);
      throw e;
    }
  }
}
