import { client, clientId } from "../../pocketbase";

export async function createTransaction({ state, dispatch }, data) {
  data = {
    ...data,
    owner: clientId,
    date: new Date(),
  };
  try {
    const collection = !data.planned ? "transactions" : "planned_transactions";
    const transaction = await client
      .collection(collection)
      .create(data, { expand: "contact,owner" });

    if (data.planned === true) {
      state.plannedTransactions = [transaction, ...state.plannedTransactions];
      return;
    }

    updateContactByTransaction(
      dispatch,
      transaction.expand.contact,
      transaction
    );

    if (transaction.type === "Income")
      dispatch("modifyUserBalance", transaction.amount);
    if (transaction.type === "Expense")
      dispatch("modifyUserBalance", -transaction.amount);
    if (transaction.type === "Refund")
      dispatch("modifyUserBalance", transaction.amount);

    // state.transactions = {
    //   ...state.transactions,
    // };
    // state.transactions.items = [transaction, ...state.transactions.items];
    console.log("loadFirstTransactions");

    dispatch("loadFirstTransactions");
  } catch (error) {
    console.log(error);
  }
}

const updateContactByTransaction = (dispatch, contact, transaction) => {
  if (transaction.type === "Invoice")
    dispatch("updateContact", {
      ...contact,
      balance: contact.balance - transaction.amount,
    });
  if (transaction.type === "Refund")
    dispatch("updateContact", {
      ...contact,
      balance: contact.balance + transaction.amount,
    });
};
