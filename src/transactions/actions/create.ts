import { client, clientId } from "../../pocketbase";
import {
  isExpense,
  isIncome,
  isInvoice,
  isRefund,
} from "../../utils/transactions";

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

    if (isIncome(transaction))
      dispatch("modifyUserBalance", transaction.amount);
    if (isExpense(transaction))
      dispatch("modifyUserBalance", -transaction.amount);
    if (isRefund(transaction))
      dispatch("modifyUserBalance", transaction.amount);

    state.transactions = {
      ...state.transactions,
    };
    state.transactions = [transaction, ...state.transactions];

    dispatch("loadFirstTransactions");
  } catch (error) {
    throw new Error(error);
  }
}

export const updateContactByTransaction = (dispatch, contact, transaction, action = "create") => {
  
  let balance = contact.balance;
  
  if (isInvoice(transaction)) {
    if(action === "create") balance -= transaction.amount
    if(action === "delete") balance += transaction.amount
  }
  if (isRefund(transaction)) {
    if(action === "create") balance += transaction.amount
    if(action === "delete") balance -= transaction.amount
  }


  dispatch("updateContact", {
    ...contact,
    balance
  });
};
