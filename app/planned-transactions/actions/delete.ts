import { client } from "../../pocketbase";

export default async function deletePlannedTransaction({ state }, id) {
  try {
    await client.collection("planned_transactions").delete(id);
    state.plannedTransactions = state.plannedTransactions.filter(
      (transaction) => transaction.id !== id
    );
  } catch (error) {
    throw new Error(error);
  }
}
