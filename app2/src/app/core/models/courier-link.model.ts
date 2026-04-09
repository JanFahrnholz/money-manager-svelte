export interface AgentLink {
  id: string;
  manager: string;
  courier: string;     // agent user ID (kept as 'courier' for DB compat)
  contactId: string;
  pairId: string;
  inventoryBalance: number;  // kept for backward compat, aggregated from batches
  salesBalance: number;
  bonusBalance: number;
  bonusPercentage: number;
  totalSales: number;
  created: string;
  updated: string;
  synced: boolean;
}

// Backward compat alias
export type CourierLink = AgentLink;
