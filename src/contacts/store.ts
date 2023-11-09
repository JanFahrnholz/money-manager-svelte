import { f7 } from "framework7-svelte";
import { client, clientId } from "../pocketbase";
import deleteContact from "./actions/delete";
import updateContact from "./actions/update";
import createContact from "./actions/create";
import getContacts from "./actions/get";

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
        couriers: state.contacts.filter(
          (contact) => contact.courier 
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
    getContacts,
    createContact,
    updateContact,
    deleteContact
  },
};

export default contactStoreConfig;
