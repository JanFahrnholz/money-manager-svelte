import { Transaction } from "../transactions/types/transaction";
import {
  isExpense,
  isIncome,
  isInvoice,
  isRefund,
} from "../utils/transactions";
import Statistics from "./statistics";

export default class TransactionStatistics extends Statistics<Transaction> {
  static type = null;

  getDataByType = (type = TransactionStatistics.type) => {
    if (type === null) return this.getData();

    return this.getData().filter((transaction) => {
      if (isIncome({ type })) return isIncome(transaction);
      if (isExpense({ type })) return isExpense(transaction);
      if (isInvoice({ type })) return isInvoice(transaction);
      if (isRefund({ type })) return isRefund(transaction);
    });
  };

  getTotalAmount = (): number => {
    return this.getDataByType().reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  };

  getAverage = () => {
    const total = this.getTotalAmount();
    const count = this.getDataByType().length;

    return total / count;
  };

  getPercentage = (type = TransactionStatistics.type) => {
    return (this.getDataByType(type).length / this.getData().length) * 100;
  };

  getFirstEntry = () => {
    return this.getDataByType().at(-1);
  };

  getLastEntry = () => {
    return this.getDataByType().at(0);
  };
}
