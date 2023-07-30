import { client, clientId } from "../pocketbase";
import { groupByProperty } from "../utils/functions";

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
    async loadPlannedTransactions({ state }) {
      try {
        const transactions = await client
          .collection("planned_transactions")
          .getFullList({
            sort: "-date",
            expand: "contact,owner",
          });
        state.plannedTransactions = transactions;
      } catch (error) {
        console.log(error);
      }
    },
    async deletePlannedTransaction({ state }, id) {
      try {
        await client.collection("planned_transactions").delete(id);
        state.plannedTransactions = state.plannedTransactions.filter(
          (transaction) => transaction.id !== id
        );
      } catch (error) {}
    },
    async confirmPlannedTransaction({ dispatch }, transaction) {
      try {
        await dispatch("createTransaction", transaction);
        await dispatch("deletePlannedTransaction", transaction.id);
      } catch (error) {}
    },
  },
};
export default plannedTransactionStoreConfig;
