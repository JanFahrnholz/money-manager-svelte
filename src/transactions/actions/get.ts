import { client } from "../../pocketbase";

export const loadFirstTransactions = async ({ state }) => {
  state.transactions.items = [];
  try {
    const res = await client
      .collection("transactions")
      .getList(1, state.transactions.perPage, {
        sort: "-date",
        expand: "contact,owner",
      });
    console.log(res);

    state.transactions = res;
  } catch (error) {
    console.log(error);
  }
};

export const loadMoreTransactions = async ({ state }) => {
  try {
    state.transactions.page++;
    if (state.transactions.page > state.transactions.totalPages) return;
    const res = await client
      .collection("transactions")
      .getList(state.transactions.page, state.transactions.perPage, {
        sort: "-date",
        expand: "contact,owner",
      });
    const items = [...state.transactions.items, ...res.items];
    state.transactions = { ...res, items };
  } catch (error) {
    console.log(error);
  }
};

export const loadAllTransactions = async ({ state }) => {
  try {
    state.transactions.items = await client
      .collection("transactions")
      .getFullList({
        sort: "-date",
        expand: "contact,owner",
      });
  } catch (error) {
    console.log(error);
  }
};
