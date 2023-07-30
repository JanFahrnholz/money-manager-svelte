import { client, clientId } from "../pocketbase";
import { f7 } from "framework7-svelte";
import updateContact from "./actions/update";
import store from "../store";
import { Contact } from "./types/contact";

const contactStoreConfig = {
  state: {
    contacts: [],
  },
  getters: {
    contacts({ state }) {
      return state.contacts;
    },
    contactsSorted({ state }) {
      return {
        external: state.contacts.filter(
          (contact) => contact.owner !== clientId
        ),
        internal: state.contacts.filter(
          (contact) => contact.owner === clientId
        ),
      };
    },
    contactById({ state }, id) {
      return state.contacts.find((contact) => contact.id === id);
    },
    totalContactBalances({ state }) {
      return state.contacts
        .filter((contact) => contact.owner === clientId)
        .reduce(
          (total, contact) => {
            return {
              positive:
                contact.balance > 0
                  ? total.positive + contact.balance
                  : total.positive,
              negative:
                contact.balance < 0
                  ? total.negative + contact.balance * -1
                  : total.negative,
              neutral: contact.balance === 0 ? ++total.neutral : total.neutral,
            };
          },
          { positive: 0, negative: 0, neutral: 0 }
        );
    },
  },
  actions: {
    async loadContacts({ state }) {
      state.loading = true;

      try {
        const contacts = await client.collection("contacts").getFullList();
        state.contacts = [];
        state.contacts = contacts;
      } catch (error) {
      } finally {
        state.loading = false;
      }
    },
    async addContact({ state }, { name, user }) {
      try {
        const contact = await client.collection("contacts").create({
          name,
          user,
          owner: clientId,
        });
        state.contacts = [...state.contacts, contact];
      } catch (error) {
        f7.toast
          .create({
            text: error.message,
            position: "top",
            closeTimeout: 2000,
          })
          .open();
        throw new Error(error.message);
      }
    },
    async deleteContact({ state }, id) {
      try {
        await client.collection("contacts").delete(id);
        state.contacts = state.contacts.filter((contact) => contact.id !== id);
      } catch (error) {
        f7.toast
          .create({
            text: error.message,
            position: "top",
            closeTimeout: 2000,
          })
          .open();
        throw new Error(error.message);
      }
    },
    updateContact,
  },
};

export default contactStoreConfig;
