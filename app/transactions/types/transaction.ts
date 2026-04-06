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
