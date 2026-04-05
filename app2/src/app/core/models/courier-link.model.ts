export interface CourierLink {
  id: string;
  manager: string;
  courier: string;
  inventoryBalance: number;
  salesBalance: number;
  bonusBalance: number;
  bonusPercentage: number;
  totalSales: number;
  created: string;
  updated: string;
  synced: boolean;
}
