import { Injectable, signal } from '@angular/core';
import { SqliteService } from './sqlite.service';
import { UserService } from './user.service';
import { EncryptedSyncService } from './encrypted-sync.service';
import type { AgentLink } from '../models/courier-link.model';
import type { Batch } from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class AgentService {
  readonly myLinks = signal<AgentLink[]>([]);
  readonly managedBy = signal<AgentLink[]>([]);

  constructor(
    private sqlite: SqliteService,
    private user: UserService,
    private sync: EncryptedSyncService,
  ) {}

  async loadMyLinks(): Promise<void> {
    const userId = this.user.user()!.id;
    const links = await this.sqlite.query<AgentLink>(
      'SELECT * FROM courier_links WHERE manager = ? ORDER BY created DESC', [userId]
    );
    this.myLinks.set(links);
  }

  async loadManagedBy(): Promise<void> {
    const userId = this.user.user()!.id;
    const links = await this.sqlite.query<AgentLink>(
      'SELECT * FROM courier_links WHERE courier = ? ORDER BY created DESC', [userId]
    );
    this.managedBy.set(links);
  }

  async getBatchesForLink(agentLinkId: string): Promise<Batch[]> {
    return this.sqlite.query<Batch>(
      'SELECT * FROM batches WHERE agentLinkId = ? ORDER BY created ASC', [agentLinkId]
    );
  }

  async getOpenBatches(agentLinkId: string): Promise<Batch[]> {
    return this.sqlite.query<Batch>(
      'SELECT * FROM batches WHERE agentLinkId = ? AND remaining > 0 ORDER BY created ASC', [agentLinkId]
    );
  }

  async getAggregatedBalances(agentLinkId: string): Promise<{ inventory: number; sales: number; bonus: number }> {
    const batches = await this.getBatchesForLink(agentLinkId);
    return {
      inventory: batches.reduce((sum, b) => sum + b.remaining, 0),
      sales: batches.reduce((sum, b) => sum + (b.salesTotal - b.collected), 0),
      bonus: batches.reduce((sum, b) => sum + (b.bonusTotal - b.redeemed), 0),
    };
  }

  async createBatch(agentLinkId: string, amount: number, type: 'commission' | 'prepaid', bonusPercentage: number): Promise<Batch> {
    const now = new Date().toISOString();
    const batch: Batch = {
      id: crypto.randomUUID(),
      agentLinkId,
      type,
      amount,
      remaining: amount,
      bonusPercentage: type === 'prepaid' ? 0 : bonusPercentage,
      salesTotal: 0,
      bonusTotal: 0,
      collected: 0,
      redeemed: 0,
      created: now,
      updated: now,
    };
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
    return batch;
  }

  async recordSale(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    if (amount > batch.remaining) throw new Error('Insufficient inventory');

    batch.remaining -= amount;
    if (batch.type === 'commission') {
      batch.salesTotal += amount;
      batch.bonusTotal += amount * (batch.bonusPercentage / 100);
    }
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  async collect(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    const openSales = batch.salesTotal - batch.collected;
    if (amount > openSales) throw new Error('Amount exceeds open sales');

    batch.collected += amount;
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  async redeem(batchId: string, amount: number): Promise<void> {
    const batch = await this.sqlite.getById<Batch>('batches', batchId);
    if (!batch) throw new Error('Batch not found');
    const openBonus = batch.bonusTotal - batch.redeemed;
    if (amount > openBonus) throw new Error('Amount exceeds open bonus');

    batch.redeemed += amount;
    batch.updated = new Date().toISOString();
    await this.sqlite.upsert('batches', batch);
    await this.sync.notifyChange('batches', batch.id, 'upsert', batch);
  }

  async getFifoBatch(agentLinkId: string): Promise<Batch | null> {
    const batches = await this.getOpenBatches(agentLinkId);
    return batches[0] ?? null;
  }
}
