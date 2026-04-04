export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
  Invoice = 'Invoice',
  Refund = 'Refund',
  Restock = 'Restock',
  Collect = 'Collect',
  Redeem = 'Redeem',
}

export interface Transaction {
  id: string;
  amount: number;
  info: string;
  date: string;
  type: TransactionType;
  contact: string;
  owner: string;
  courierLink: string;
  planned: boolean;
  created: string;
  updated: string;
  synced: boolean;
}
