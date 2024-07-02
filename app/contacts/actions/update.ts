import { f7 } from "framework7-svelte";
import { client, clientId } from "../../pocketbase";
import { ApiError } from "../../utils/errors";

export async function updateContact({ state }, contact) {
  try {
    if (contact.user === clientId && contact.owner === clientId) throw new Error("You cannot link yourself!");

    const contactId = contact.id;
    const newContact = await client
      .collection("contacts")
      .update(contactId, contact);

    state.contacts = state.contacts.map((contact) => {
      return contact.id === contactId ? newContact : contact;
    });

    f7.toast.create({ text: "updated contact", closeTimeout: 2000 });
    return newContact;
  } catch (error) {
    console.log(error)
    new ApiError(error).dialog();
  }
}

export async function editLinkedName({ state }, contact){
  try {
    const res = await client.send(`/contact/${contact.id}/edit-linked-name`,{
      method: "POST",
      body: contact
    })

    state.contacts = state.contacts.map((c) => {
      return c.id === contact.id ? res.contact : c;
    });

    return res.contact
  } catch (error) {
    new ApiError(error).dialog()
  }
}