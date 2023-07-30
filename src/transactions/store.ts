import { client, clientId } from "../pocketbase";
import { createTransaction } from "./actions/create";
import {
  loadAllTransactions,
  loadMoreTransactions,
  loadFirstTransactions,
} from "./actions/get";
import { deleteTransaction } from "./actions/delete";

const transactionStoreConfig = {
  state: {
    transactions: {
      items: [],
      page: 1,
      perPage: 12,
    },
  },
  getters: {
    transactions({ state }) {
      return state.transactions;
    },
  },
  actions: {
    loadFirstTransactions,
    loadMoreTransactions,
    loadAllTransactions,
    createTransaction,
    deleteTransaction,
  },
};
export default transactionStoreConfig;
