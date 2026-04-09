export interface SyncEvent {
  action: 'upsert' | 'delete';
  table: 'contacts' | 'transactions' | 'courier_links' | 'batches';
  recordId: string;
  data: Record<string, any>;
  timestamp: string;
}
