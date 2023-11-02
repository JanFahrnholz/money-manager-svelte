import { f7 } from "framework7-svelte";
import { client } from "../../pocketbase";

export default async function deleteContact({ state }, id) {
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
  }