import { f7 } from "framework7-svelte";
import { client } from "../../pocketbase";

export default async function modifyContactBalance(
  { state },
  contact,
  modifier
) {
  try {
    const contactId = contact.id;
    const oldContact = await client.collection("contacts").getOne(contactId);

    const newContact = await client.collection("contacts").update(contactId, {
      ...oldContact,
      amount: oldContact.amount + modifier,
    });

    state.contacts = state.contacts.map((contact) => {
      return contact.id === contactId ? newContact : contact;
    });

    f7.toast.create({
      text: `updated contact ${contact.name}`,
      closeTimeout: 2000,
    });
  } catch (error) {}
}
