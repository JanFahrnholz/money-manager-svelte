import { Injectable, computed, signal } from '@angular/core';
import { SqliteService } from '../../../core/services/sqlite.service';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { EncryptedSyncService } from '../../../core/services/encrypted-sync.service';
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
    private sync: EncryptedSyncService,
  ) {}

  async loadAll(): Promise<void> {
    const rows = await this.sqlite.getAll<Contact>('contacts', 'name ASC');
    this.contacts.set(rows);
    await this.calculateScores();
  }

  async calculateScores(): Promise<void> {
    const contacts = this.contacts();
    for (const contact of contacts) {
      const txs = await this.sqlite.query<{ type: string; amount: number }>(
        'SELECT type, amount FROM transactions WHERE contact = ? AND planned = 0',
        [contact.id],
      );

      let totalIncome = 0,
        totalExpense = 0,
        totalInvoice = 0,
        totalRefund = 0;
      for (const tx of txs) {
        if (tx.type === 'Income') totalIncome += tx.amount;
        if (tx.type === 'Expense') totalExpense += tx.amount;
        if (tx.type === 'Invoice') totalInvoice += tx.amount;
        if (tx.type === 'Refund') totalRefund += tx.amount;
      }

      const netBalance = contact.balance;
      const netTransactions = totalIncome - totalExpense;

      const normalize = (val: number, min: number, max: number) => {
        if (max === min) return 0;
        return (val - min) / (max - min) - 0.5;
      };

      const score =
        (normalize(netBalance, -1000, 1000) * 0.25 +
          normalize(netTransactions, -2000, 2000) * 0.25 +
          normalize(-totalInvoice, -1000, 0) * 0.25 +
          normalize(totalRefund, 0, 500) * 0.25) *
        100;

      contact.score = Math.round(score * 100) / 100;
    }
    this.contacts.set([...contacts]);
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
      await this.sync.notifyChange('contacts', contact.id, 'upsert', contact);
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
      const full = await this.sqlite.getById('contacts', id);
      if (full) await this.sync.notifyChange('contacts', id, 'upsert', full);
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
      await this.sync.notifyChange('contacts', id, 'delete', { id });
      this.toast.success('Kontakt gelöscht');
    } catch (e: any) {
      this.toast.error('Fehler: ' + e.message);
      throw e;
    }
  }
}
