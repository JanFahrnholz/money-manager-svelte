import type { Transaction } from "../transactions/transaction";
import type { TransactionType } from "../transactions/transaction-type";
import {
  isExpense,
  isIncome,
  isInvoice,
  isRefund,
} from "../utils/transactions";
import Statistics from "./statistics";

export default class TransactionStatistics extends Statistics<Transaction> {
  getByType = (type: TransactionType) =>
    this.getData().filter((transaction) => {
      if (isIncome({ type })) return isIncome(transaction);
      if (isExpense({ type })) return isExpense(transaction);
      if (isInvoice({ type })) return isInvoice(transaction);
      if (isRefund({ type })) return isRefund(transaction);
    });

  getTotalAmountByType = (type: TransactionType): number => {
    return this.getByType(type).reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  };

  getAverageByType = (type: TransactionType) => {
    const total = this.getTotalAmountByType(type);
    const count = this.getByType(type).length;

    return total / count;
  };
}
