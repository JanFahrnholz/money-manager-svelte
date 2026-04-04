import { Injectable } from '@angular/core';
import { SqliteService } from '../../../core/services/sqlite.service';
import { AuthService } from '../../../core/services/auth.service';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(
    private sqlite: SqliteService,
    private auth: AuthService,
  ) {}

  async loadByContact(contactId: string, limit = 50): Promise<Transaction[]> {
    return this.sqlite.query<Transaction>(
      'SELECT * FROM transactions WHERE contact = ? AND planned = 0 ORDER BY date DESC LIMIT ?',
      [contactId, limit],
    );
  }

  async loadRecent(limit = 20): Promise<Transaction[]> {
    const userId = this.auth.user()?.id ?? '';
    return this.sqlite.query<Transaction>(
      'SELECT * FROM transactions WHERE owner = ? AND planned = 0 ORDER BY date DESC LIMIT ?',
      [userId, limit],
    );
  }

  async loadPlanned(): Promise<Transaction[]> {
    const userId = this.auth.user()?.id ?? '';
    return this.sqlite.query<Transaction>(
      'SELECT * FROM transactions WHERE owner = ? AND planned = 1 ORDER BY date DESC',
      [userId],
    );
  }

  async loadByTimeframe(contactId: string, startDate: string): Promise<Transaction[]> {
    return this.sqlite.query<Transaction>(
      'SELECT * FROM transactions WHERE contact = ? AND planned = 0 AND date >= ? ORDER BY date DESC',
      [contactId, startDate],
    );
  }

  async create(data: {
    amount: number;
    type: TransactionType;
    contact: string;
    info?: string;
    planned?: boolean;
  }): Promise<Transaction> {
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
    const now = new Date().toISOString();
    const owner = this.auth.user()?.id ?? '';
    const planned = data.planned ?? false;

    const tx: Transaction = {
      id,
      amount: data.amount,
      info: data.info ?? '',
      date: now,
      type: data.type,
      contact: data.contact,
      owner,
      courierLink: '',
      planned,
      created: now,
      updated: now,
      synced: false,
    };

    await this.sqlite.upsert('transactions', {
      ...tx,
      planned: planned ? 1 : 0,
      synced: 0,
    });

    if (!planned) {
      await this.updateContactBalance(tx);
    }

    return tx;
  }

  async confirmPlanned(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.sqlite.run(
      'UPDATE transactions SET planned = 0, date = ?, synced = 0, updated = ? WHERE id = ?',
      [now, now, id],
    );

    const tx = await this.sqlite.getById<Transaction>('transactions', id);
    if (tx) {
      await this.updateContactBalance(tx);
    }
  }

  async remove(id: string): Promise<void> {
    const tx = await this.sqlite.getById<Transaction>('transactions', id);
    if (!tx) return;

    if (!tx.planned) {
      await this.updateContactBalance(tx, true);
    }

    await this.sqlite.delete('transactions', id);
  }

  private async updateContactBalance(tx: Transaction, reverse = false): Promise<void> {
    let delta = 0;

    if (tx.type === TransactionType.Invoice) {
      delta = -tx.amount;
    } else if (tx.type === TransactionType.Refund) {
      delta = tx.amount;
    } else {
      return;
    }

    if (reverse) {
      delta = -delta;
    }

    await this.sqlite.run(
      'UPDATE contacts SET balance = balance + ?, updated = ? WHERE id = ?',
      [delta, new Date().toISOString(), tx.contact],
    );
  }
}
