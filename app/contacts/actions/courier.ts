import { f7 } from "framework7-svelte";
import { client } from "../../pocketbase";
import { ApiError } from "../../utils/errors";

export async function makeCourier({ state }, contact) {
  try {
    const { id } = contact;

    const newContact = await client.send(`/contact/${id}/make-courier`, {
      method: "POST",
    });

    state.contacts = state.contacts.map((contact) => {
      return contact.id === id ? newContact : contact;
    });

    f7.toast.create({ text: "courier created", closeTimeout: 2000 });
    return newContact;
  } catch (error) {
    new ApiError(error).dialog();
    return contact;
  }
}

export async function removeCourier({ state }, contact) {
  try {
    const { id } = contact;
    const newContact = await client.send(`/contact/${id}/remove-courier`, {
      method: "POST",
    });

    state.contacts = state.contacts.map((contact) => {
      return contact.id === id ? newContact : contact;
    });

    f7.toast.create({ text: "courier removed", closeTimeout: 2000 });
    return newContact;
  } catch (error) {
    new ApiError(error).dialog();
    return contact;
  }
}
