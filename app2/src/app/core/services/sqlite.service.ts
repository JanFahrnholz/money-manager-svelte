import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'moneymanager';

@Injectable({ providedIn: 'root' })
export class SqliteService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private db!: SQLiteDBConnection;

  readonly ready = signal(false);

  async init(): Promise<void> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    await this.db.open();
    await this.createTables();
    this.ready.set(true);
  }

  private async createTables(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        balance REAL DEFAULT 0,
        settings TEXT DEFAULT '{}',
        language TEXT DEFAULT 'en',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        linkedName TEXT DEFAULT '',
        balance REAL DEFAULT 0,
        owner TEXT NOT NULL,
        user TEXT DEFAULT '',
        statistics TEXT DEFAULT '',
        score REAL DEFAULT 0,
        created TEXT NOT NULL,
        updated TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        info TEXT DEFAULT '',
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        contact TEXT NOT NULL,
        owner TEXT NOT NULL,
        courierLink TEXT DEFAULT '',
        planned INTEGER DEFAULT 0,
        created TEXT NOT NULL,
        updated TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS courier_links (
        id TEXT PRIMARY KEY,
        manager TEXT NOT NULL,
        courier TEXT NOT NULL,
        inventoryBalance REAL DEFAULT 0,
        salesBalance REAL DEFAULT 0,
        bonusBalance REAL DEFAULT 0,
        bonusPercentage REAL DEFAULT 5,
        totalSales REAL DEFAULT 0,
        created TEXT,
        updated TEXT,
        synced INTEGER DEFAULT 0
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS statistics (
        id TEXT PRIMARY KEY,
        contact TEXT NOT NULL,
        owner TEXT NOT NULL,
        data TEXT DEFAULT '{}',
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS device (
        id TEXT PRIMARY KEY,
        publicKey TEXT NOT NULL,
        privateKey TEXT NOT NULL,
        created TEXT NOT NULL
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY,
        localContactId TEXT NOT NULL,
        remoteDeviceId TEXT NOT NULL,
        remotePublicKey TEXT NOT NULL,
        sharedKey TEXT NOT NULL,
        label TEXT DEFAULT '',
        created TEXT NOT NULL
      );
    `);
  }

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await this.db.query(sql, params);
    return (result.values ?? []) as T[];
  }

  async run(sql: string, params: any[] = []): Promise<void> {
    await this.db.run(sql, params);
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const results = await this.query<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async getAll<T>(table: string, orderBy: string = 'created DESC'): Promise<T[]> {
    return this.query<T>(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
  }

  async upsert(table: string, data: Record<string, any>): Promise<void> {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => '?').join(', ');
    const updates = keys
      .filter((k) => k !== 'id')
      .map((k) => `${k} = excluded.${k}`)
      .join(', ');
    const values = keys.map((k) => {
      const v = data[k];
      if (v !== null && typeof v === 'object') return JSON.stringify(v);
      return v;
    });

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})
      ON CONFLICT(id) DO UPDATE SET ${updates}`;

    await this.db.run(sql, values);
  }

  async delete(table: string, id: string): Promise<void> {
    await this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }
}
