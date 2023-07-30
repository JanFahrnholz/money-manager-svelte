import { Record } from "pocketbase";
import type { TransactionType } from "./transaction-type";

export type Transaction = Record & {
  amount: number;
  info: string;
  date: Date;
  type: TransactionType;
  contact: string;
  owner: string;
};

// "amount": 123,
// "info": "test",
// "date": "2022-01-01 10:00:00",
// "contact": "RELATION_RECORD_ID",
// "owner": "test",
// "type": "Einnahme"
