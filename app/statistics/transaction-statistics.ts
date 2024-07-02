import {Transaction} from "../transactions/types/transaction";
import {
    isExpense,
    isIncome,
    isInvoice,
    isRefund,
} from "../utils/transactions";
import Statistics from "./statistics";
import {types} from "../transactions/types/transaction-type";

export default class TransactionStatistics extends Statistics<Transaction> {
    static type = null;

    getDataByType = (type = TransactionStatistics.type) => {
        if (type === null) return this.getData();

        return this.getData().filter((transaction) => {
            if (isIncome({type})) return isIncome(transaction);
            if (isExpense({type})) return isExpense(transaction);
            if (isInvoice({type})) return isInvoice(transaction);
            if (isRefund({type})) return isRefund(transaction);
        });
    };

    getCount = (type = TransactionStatistics.type): number => {
        return this.getDataByType(type).length
    }

    getTotalAmount = (type = TransactionStatistics.type): number => {
        return this.getDataByType(type).reduce(
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

    getIncomeExpenseDifference = () => {
        return this.getTotalAmount("Income") - this.getTotalAmount("Expense")
    }
    getRefundInvoiceDifference = () => {
        return this.getTotalAmount("Refund") - this.getTotalAmount("Invoice")
    }
    getCombinedDifference = () => {
        return this.getIncomeExpenseDifference() + this.getTotalAmount("Refund")
    }

    getFirstEntry = () => {
        return this.getDataByType().at(-1);
    };

    getLastEntry = () => {
        return this.getDataByType().at(0);
    };



    getAreaChartData = (weeks = 4) => {

        const colors = {
            "Income": "#0f0",
            "Expense": "#f00",
            "Invoice": "#ff0",
            "Refund": "#060",
        }

        return {
            datasets: types.map((type) => ({
                label: type,
                color: colors[type],
                values: this.getGroupedItems("day")
            }))
        }


    }
}
