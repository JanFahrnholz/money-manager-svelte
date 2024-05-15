import { client, clientId } from "../../pocketbase";

export default async function confirmPlannedTransaction(
  { state, dispatch },
  transaction
) {
  try {
    await client.send(`/${clientId}/planned_transactions/${transaction.id}/confirm`, {
      method: "GET"
    })

    state.plannedTransactions = state.plannedTransactions.filter(
      (t) =>  t.id !== transaction.id
    );
    state.transactions = [transaction, ...state.transactions];

  } catch (error) {
    throw new Error(error);
  }
}
