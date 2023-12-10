import { client, clientId } from "../../pocketbase";
import { errorToast } from "../../utils/toast";

export default async function createContact({ state }, { name, user }) {
  try {
    const contact = await client.collection("contacts").create({
      name,
      user,
      owner: clientId,
    });
    state.contacts = [...state.contacts, contact];
  } catch (error) {
    errorToast(error);
    throw new Error(error.message);
  }
}
