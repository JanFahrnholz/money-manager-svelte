import { createStore } from "framework7/lite";
import contactStoreConfig from "./contacts/store";
import authStoreConfig from "./auth/store";
import transactionStoreConfig from "./transactions/store";
import plannedTransactionStoreConfig from "./planned-transactions/store";
import { writable } from "svelte/store";

const store = createStore({
  state: {
    activeTab: 1,
    ...plannedTransactionStoreConfig.state,
    ...transactionStoreConfig.state,
    ...contactStoreConfig.state,
    ...authStoreConfig.state,
  },
  getters: {
    activeTab: ({ state }) => state.activeTab,
    ...plannedTransactionStoreConfig.getters,
    ...transactionStoreConfig.getters,
    ...contactStoreConfig.getters,
    ...authStoreConfig.getters,
  },
  actions: {
    setActiveTab: ({ state }, tab) => (state.activeTab = tab),
    ...plannedTransactionStoreConfig.actions,
    ...transactionStoreConfig.actions,
    ...contactStoreConfig.actions,
    ...authStoreConfig.actions,
  },
});

export const alerts = writable([]);

export default store;
