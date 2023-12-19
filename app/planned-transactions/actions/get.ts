import { client } from "../../pocketbase";

export default async function getPlannedTransactions({ state }) {
  try {
    const transactions = await client
      .collection("planned_transactions")
      .getFullList({
        sort: "-date",
        expand: "contact,owner",
      });
    state.plannedTransactions = transactions;
  } catch (error) {
    throw new Error(error);
  }
}
