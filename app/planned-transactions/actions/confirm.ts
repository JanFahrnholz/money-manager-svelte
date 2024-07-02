import { client, clientId } from "../../pocketbase";
import { ApiError } from "../../utils/errors";

export default async function confirmPlannedTransaction(
  { state, dispatch },
  transaction
) {
  try {
    await client.send(`/planned_transactions/${transaction.id}/confirm`, {
      method: "POST"
    })

    state.plannedTransactions = state.plannedTransactions.filter(
      (t) =>  t.id !== transaction.id
    );
    state.transactions = [transaction, ...state.transactions];

  } catch (error) {
    throw new ApiError(error).dialog();
  }
}
