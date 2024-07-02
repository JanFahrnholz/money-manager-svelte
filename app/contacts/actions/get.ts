import { client } from "../../pocketbase";
import { Contact } from "../../utils/iterator";

export default async function getContacts({ state }) {
  state.loading = true;

  try {
    state.contacts = await client.collection("contacts").getFullList<Contact>({
      expand: "courier",
    });
  } catch (error) {
    console.log(error);
  } finally {
    state.loading = false;
  }
}
