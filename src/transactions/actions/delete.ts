import { client } from "../../pocketbase";
import { isInvoice, isRefund } from "../../utils/transactions";
import { updateContactByTransaction } from "./create";

export const deleteTransaction = async ({ state, dispatch }, transaction) => {
  try {
    const { id, amount, expand } = transaction;
    await client.collection("transactions").delete(id);
    state.transactions.items = state.transactions.items.filter(
      (transaction) => transaction.id !== id
    );

    updateContactByTransaction(dispatch, expand.contact, transaction, "delete");
  } catch (error) {
    throw new Error(error);
  }
};
