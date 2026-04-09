export interface Batch {
  id: string;
  agentLinkId: string;
  type: 'commission' | 'prepaid';
  amount: number;
  remaining: number;
  bonusPercentage: number;
  salesTotal: number;
  bonusTotal: number;
  collected: number;
  redeemed: number;
  created: string;
  updated: string;
}
