import { Injectable, signal } from '@angular/core';
import { SqliteService } from '../../../core/services/sqlite.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import type { CourierLink } from '../../../core/models/courier-link.model';
import type { Contact } from '../../../core/models/contact.model';
import type { User } from '../../../core/models/user.model';

export interface NetworkNode {
  link: CourierLink;
  courierName: string;
  children: NetworkNode[];
}

@Injectable({ providedIn: 'root' })
export class CourierService {
  readonly myLinks = signal<CourierLink[]>([]);
  readonly managedBy = signal<CourierLink[]>([]);

  constructor(
    private sqlite: SqliteService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  async loadMyLinks(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const rows = await this.sqlite.query<CourierLink>(
      'SELECT * FROM courier_links WHERE manager = ? ORDER BY created DESC',
      [userId],
    );
    this.myLinks.set(rows.map((r) => this.mapRow(r)));
  }

  async loadManagedBy(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const rows = await this.sqlite.query<CourierLink>(
      'SELECT * FROM courier_links WHERE courier = ? ORDER BY created DESC',
      [userId],
    );
    this.managedBy.set(rows.map((r) => this.mapRow(r)));
  }

  async getById(id: string): Promise<CourierLink | null> {
    const row = await this.sqlite.getById<CourierLink>('courier_links', id);
    return row ? this.mapRow(row) : null;
  }

  async getByManager(userId: string): Promise<CourierLink[]> {
    const rows = await this.sqlite.query<CourierLink>(
      'SELECT * FROM courier_links WHERE manager = ? ORDER BY created DESC',
      [userId],
    );
    return rows.map((r) => this.mapRow(r));
  }

  async getByCourier(userId: string): Promise<CourierLink[]> {
    const rows = await this.sqlite.query<CourierLink>(
      'SELECT * FROM courier_links WHERE courier = ? ORDER BY created DESC',
      [userId],
    );
    return rows.map((r) => this.mapRow(r));
  }

  async getNetworkTree(userId: string): Promise<NetworkNode[]> {
    const links = await this.getByManager(userId);
    const nodes: NetworkNode[] = [];

    for (const link of links) {
      const courierName = await this.resolveCourierName(link.courier);
      const children = await this.getNetworkTree(link.courier);
      nodes.push({ link, courierName, children });
    }

    return nodes;
  }

  async create(courierId: string, bonusPercentage: number): Promise<CourierLink> {
    const managerId = this.auth.user()?.id ?? '';
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 15);
    const now = new Date().toISOString();

    const link: CourierLink = {
      id,
      manager: managerId,
      courier: courierId,
      inventoryBalance: 0,
      salesBalance: 0,
      bonusBalance: 0,
      bonusPercentage,
      totalSales: 0,
      created: now,
      updated: now,
      synced: false,
    };

    await this.sqlite.upsert('courier_links', { ...link, synced: 0 });
    this.myLinks.update((list) => [...list, link]);
    this.toast.success('Courier link created');
    return link;
  }

  async remove(id: string): Promise<void> {
    const link = await this.getById(id);
    if (!link) return;

    if (link.inventoryBalance !== 0 || link.salesBalance !== 0 || link.bonusBalance !== 0) {
      this.toast.error('All balances must be 0 before removing a courier link');
      return;
    }

    await this.sqlite.delete('courier_links', id);
    this.myLinks.update((list) => list.filter((l) => l.id !== id));
    this.managedBy.update((list) => list.filter((l) => l.id !== id));
    this.toast.success('Courier link removed');
  }

  async restock(id: string, amount: number): Promise<void> {
    const now = new Date().toISOString();
    await this.sqlite.run(
      'UPDATE courier_links SET inventoryBalance = inventoryBalance + ?, updated = ?, synced = 0 WHERE id = ?',
      [amount, now, id],
    );
    this.myLinks.update((list) =>
      list.map((l) =>
        l.id === id ? { ...l, inventoryBalance: l.inventoryBalance + amount, updated: now } : l,
      ),
    );
    this.toast.success('Inventory restocked');
  }

  async collect(id: string, amount: number): Promise<void> {
    const link = await this.getById(id);
    if (!link) return;

    if (amount > link.salesBalance) {
      this.toast.error('Amount exceeds available sales balance');
      return;
    }

    const now = new Date().toISOString();
    await this.sqlite.run(
      'UPDATE courier_links SET salesBalance = salesBalance - ?, updated = ?, synced = 0 WHERE id = ?',
      [amount, now, id],
    );
    this.myLinks.update((list) =>
      list.map((l) =>
        l.id === id ? { ...l, salesBalance: l.salesBalance - amount, updated: now } : l,
      ),
    );
    this.toast.success('Sales collected');
  }

  async redeemBonus(id: string, amount: number): Promise<void> {
    const link = await this.getById(id);
    if (!link) return;

    if (amount > link.bonusBalance) {
      this.toast.error('Amount exceeds available bonus balance');
      return;
    }

    const now = new Date().toISOString();
    await this.sqlite.run(
      'UPDATE courier_links SET bonusBalance = bonusBalance - ?, updated = ?, synced = 0 WHERE id = ?',
      [amount, now, id],
    );
    this.myLinks.update((list) =>
      list.map((l) =>
        l.id === id ? { ...l, bonusBalance: l.bonusBalance - amount, updated: now } : l,
      ),
    );
    this.toast.success('Bonus redeemed');
  }

  async updateBonusPercentage(id: string, pct: number): Promise<void> {
    const now = new Date().toISOString();
    await this.sqlite.run(
      'UPDATE courier_links SET bonusPercentage = ?, updated = ?, synced = 0 WHERE id = ?',
      [pct, now, id],
    );
    this.myLinks.update((list) =>
      list.map((l) => (l.id === id ? { ...l, bonusPercentage: pct, updated: now } : l)),
    );
    this.toast.success('Bonus percentage updated');
  }

  private async resolveCourierName(courierId: string): Promise<string> {
    const contacts = await this.sqlite.query<Contact>(
      'SELECT * FROM contacts WHERE user = ? LIMIT 1',
      [courierId],
    );
    if (contacts.length > 0) {
      return contacts[0].name;
    }

    const users = await this.sqlite.query<User>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [courierId],
    );
    if (users.length > 0) {
      return users[0].username;
    }

    return 'Unknown';
  }

  private mapRow(row: any): CourierLink {
    return {
      ...row,
      synced: row.synced === 1 || row.synced === true,
    };
  }
}
