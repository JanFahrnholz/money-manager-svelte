import type { Transaction } from "../transactions/transaction";
import type { TransactionType } from "../transactions/transaction-type";
import Statistics from "./statistics";

export default class TransactionStatistics extends Statistics<Transaction> {
  getByType = (type: TransactionType) =>
    this.getData().filter((transaction) => transaction.type === type);

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
