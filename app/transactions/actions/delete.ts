import { client } from "../../pocketbase";

export const deleteTransaction = async ({ state }, transaction) => {
  try {
    const { id } = transaction;
    await client.collection("transactions").delete(id);
    state.transactions = state.transactions.filter(
      (transaction) => transaction.id !== id
    );

  } catch (error) {
    throw new Error(error);
  }
};
