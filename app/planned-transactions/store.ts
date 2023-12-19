import { client, clientId } from "../pocketbase";
import { groupByProperty } from "../utils/functions";
import getPlannedTransactions from "./actions/get";
import deletePlannedTransaction from "./actions/delete";
import confirmPlannedTransaction from "./actions/confirm";

const plannedTransactionStoreConfig = {
  state: {
    plannedTransactions: [],
  },
  getters: {
    plannedTransactions({ state }) {
      return state.plannedTransactions;
    },
    plannedTransactionsByContact({ state }) {
      let transactions = groupByProperty(state.plannedTransactions, "contact");
      return Object.entries(transactions);
    },
  },
  actions: {
    getPlannedTransactions,
    deletePlannedTransaction,
    confirmPlannedTransaction    
  },
};
export default plannedTransactionStoreConfig;
