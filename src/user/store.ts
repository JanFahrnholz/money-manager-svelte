import { f7 } from "framework7-svelte";
import { client, clientId } from "../pocketbase";
import { alerts } from "../store";
import { errorToast } from "../utils/toast";
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
        dispatch("getFirstTransactions");
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
        await dispatch("updateUser", {
          ...state.user,
          balance: state.user.balance + modifier,
        });
      } catch (error) {}
    },
    async updateSetting({state, dispatch}, {key, value}){
      try {
        dispatch("updateUser", {
          id: state.user.id,
          settings: {
            ...state.user.settings,
            [key]: value,
          }
        })
        f7.toast.create({text: "user settings updated", closeTimeout: 1000})
      } catch (error) {
        errorToast({message: "could not update settings"})
        
      }
    } 
  },
};
export default authStoreConfig;
