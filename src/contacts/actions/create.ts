import { f7 } from "framework7-svelte";
import { client, clientId } from "../../pocketbase";

export default async function createContact({ state }, { name, user }) {
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
  }