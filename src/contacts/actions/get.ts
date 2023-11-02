import { client } from "../../pocketbase";

export default async function getContacts({ state }) {
  state.loading = true;

  try {
    const contacts = await client.collection("contacts").getFullList();
    state.contacts = [];
    state.contacts = contacts;
  } catch (error) {
  } finally {
    state.loading = false;
  }
}
