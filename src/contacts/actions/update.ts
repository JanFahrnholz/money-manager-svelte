import { f7 } from "framework7-svelte";
import { client } from "../../pocketbase";

export default async function updateContact({ state }, contact) {
  try {
    const contactId = contact.id;
    const newContact = await client
      .collection("contacts")
      .update(contactId, contact);

    state.contacts = state.contacts.map((contact) => {
      return contact.id === contactId ? newContact : contact;
    });

    f7.toast.create({ text: "updated contact", closeTimeout: 2000 });
  } catch (error) {}
}
