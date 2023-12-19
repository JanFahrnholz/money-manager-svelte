import Client, { Record } from "pocketbase";
import type { TransactionType } from "./transaction-type";

export type Transaction = Record & {
  amount: number;
  info: string;
  date: Date;
  type: TransactionType;
  contact: string;
  owner: string;
};

export class Transaction2 extends Record{
  amount: number;
  info: string;
  date: Date;
  type: string;
  contact: string;
  owner: string;

  public getType(){
    if(this.type === "Income" || this.type === "Einnahme") return "Income";
    if(this.type === "Expense" || this.type === "Ausgabe") return "Expense";
    if(this.type === "Invoice" || this.type === "Rechnung") return "Invoice";
    if(this.type === "Refund" || this.type === "Rückzahlung") return "Refund";
  }

  public getOwner(){
    return this.expand.owner;
  }

  public getContact(){
    return this.expand.contact;
  }
}

export class Transaction2Collection {
  constructor(items){

  }
}

// "amount": 123,
// "info": "test",
// "date": "2022-01-01 10:00:00",
// "contact": "RELATION_RECORD_ID",
// "owner": "test",
// "type": "Einnahme"
