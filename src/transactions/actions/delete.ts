import { client } from "../../pocketbase";

export const deleteTransaction = async ({ state }, id) => {
  try {
    await client.collection("transactions").delete(id);
    state.transactions.items = state.transaction.filter(
      (transaction) => transaction.id !== id
    );
  } catch (error) {
    console.log(error);
  }
};
