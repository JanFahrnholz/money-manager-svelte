import { client } from "../../pocketbase";

export const getFirstTransactions = async ({ state }) => {
  const filterDate = new Date();
  filterDate.setDate(filterDate.getDate() - 31);
  try {
    state.transactions = await client.collection("transactions").getFullList({
      sort: "-date",
      filter: `date > "${filterDate.toISOString().replace("T", " ")}"`,
      expand: "contact,owner",
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const getMoreTransactions = async ({ state }) => {
  try {
    const lastTransactionDate = new Date(state.transactions.at(-1).date);
    const lastFilterDate = new Date(
      state.lastTransactionFilterDate || lastTransactionDate
    );
    const filterDate = new Date(lastFilterDate);
    filterDate.setDate(lastFilterDate.getDate() - 30);

    const res = await client.collection("transactions").getFullList({
      sort: "-date",
      filter: `date > "${filterDate.toISOString().replace("T", " ")}" && date < "${lastFilterDate.toISOString().replace("T", " ")}"`,
      expand: "contact,owner",
    });

    state.transactions = [...state.transactions, ...res];
    state.lastTransactionFilterDate = filterDate;
  } catch (error) {
    throw new Error(error);
  }
};

export const getAllTransactions = async ({ state }) => {
  try {
    state.transactions = await client.collection("transactions").getFullList({
      sort: "-date",
      expand: "contact,owner",
    });
  } catch (error) {
    throw new Error(error);
  }
};

const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;

export const getTransactions = async ({ state }, { filter }) => {
  if (filter?.includes("date")) {
    const filterDate = new Date(filter?.match(isoDateRegex));
    const lastTransactionDate = new Date(state.transactions.at(-1).date);
    const lastFilterDate = new Date(
      state.lastTransactionFilterDate || lastTransactionDate
    );

    if (lastFilterDate.getTime() <= filterDate.getTime()) {
      return;
    } else {
      state.lastTransactionFilterDate = filterDate;
    }
  }

  try {
    state.transactions = await client.collection("transactions").getFullList({
      sort: "-date",
      filter,
      expand: "contact,owner",
    });
  } catch (error) {
    throw new Error(error);
  }
};
