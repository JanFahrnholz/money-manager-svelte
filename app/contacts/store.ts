import { f7 } from "framework7-svelte";
import { client, clientId } from "../pocketbase";
import deleteContact from "./actions/delete";
import { updateContact, editLinkedName } from "./actions/update";
import createContact from "./actions/create";
import getContacts from "./actions/get";
import { makeCourier, removeCourier } from "./actions/courier";

const contactStoreConfig = {
  state: {
    contacts: [],
    managerContacts: [],
  },
  getters: {
    contacts({ state }) {
      return state.contacts;
    },
    managerContacts({ state }) {
      return state.managerContacts;
    },
    contactsSorted({ state }) {
      return {
        external: state.contacts.filter(
          (contact) => contact.owner !== clientId
        ),
        internal: state.contacts.filter(
          (contact) => contact.owner === clientId && !contact.courier
        ),
        couriers: state.contacts
          .filter((contact) => contact.owner === clientId)
          .filter((contact) => contact.courier),
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
    hasLinkedContact({state}){
      return state.contacts.some(c => c.user)
    }
  },
  actions: {
    getContacts,
    createContact,
    updateContact,
    editLinkedName,
    deleteContact,
    makeCourier,
    removeCourier,
  },
};

export default contactStoreConfig;
