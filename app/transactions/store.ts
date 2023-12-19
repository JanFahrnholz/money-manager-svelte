import { createTransaction } from "./actions/create";
import {
  getAllTransactions,
  getMoreTransactions,
  getFirstTransactions,
  getTransactions,
} from "./actions/get";
import { deleteTransaction } from "./actions/delete";

const transactionStoreConfig = {
  state: {
    transactions: [],
    lastTransactionFilterDate: undefined,
  },
  getters: {
    transactions({ state }) {
      return state.transactions;
    },
  },
  actions: {
    getTransactions,
    getFirstTransactions,
    getMoreTransactions,
    getAllTransactions,
    createTransaction,
    deleteTransaction,
  },
};
export default transactionStoreConfig;
