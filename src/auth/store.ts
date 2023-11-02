import { client, clientId } from "../pocketbase";
import { alerts } from "../store";
const authStoreConfig = {
  state: {
    user: client.authStore.model,
  },
  getters: {
    user({ state }) {
      return state.user;
    },
  },
  actions: {
    async login({ state, dispatch }, { username, password }) {
      try {
        const res = await client
          .collection("users")
          .authWithPassword(username, password);
        state.user = res.record;
        dispatch("loadFirstTransactions");
        dispatch("getContacts");
      } catch (error) {
        alerts.update((alerts) => [...alerts, error.message]);
      }
    },
    logout({ state }) {
      client.authStore.clear();

      state.user = null;
    },
    async updateUser({ state }, user) {
      try {
        const newUser = await client.collection("users").update(clientId, user);
        state.user = { ...newUser };
      } catch (error) {}
    },
    async modifyUserBalance({ state, dispatch }, modifier: number) {
      try {
        console.log(modifier);

        await dispatch("updateUser", {
          ...state.user,
          balance: state.user.balance + modifier,
        });
      } catch (error) {}
    },
  },
};
export default authStoreConfig;
