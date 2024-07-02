const {
  getTransactionsByContactId,
  isIncome,
  isExpense,
  isInvoice,
  isRefund,
} = require(`${__hooks}/utils.js`);

/** @param {models.Record} contact  */
function calculateContactScore(contact) {
  function normalize(value, minVal, maxVal) {
    return (value - minVal) / (maxVal - minVal) - 0.5;
  }

  const transactions = getTransactionsByContactId(contact.getId());

  const contactData = transactions.reduce(
    (data, item) => {
      if (isIncome(item)) data.totalIncome + item.amount;
      if (isExpense(item)) data.totalExpense + item.amount;
      if (isInvoice(item)) data.totalInvoice + item.amount;
      if (isRefund(item)) data.totalRefund + item.amount;

      return data;
    },
    {
      totalIncome: 0,
      totalExpense: 0,
      totalInvoice: 0,
      totalRefund: 0,
    }
  );

  const netBalance = contact.getInt("balance");
  const totalIncome = contactData.totalIncome;
  const totalExpense = contactData.totalExpense;
  const invoiceImpact = contactData.totalInvoice;
  const refundImpact = contactData.totalRefund;

  const netTransactions = totalIncome - totalExpense;

  // Define ranges
  const balanceRange = [-1000, 1000];
  const transactionRange = [-2000, 2000];
  const invoiceRange = [-1000, 0];
  const refundRange = [0, 500];

  // Normalize values
  const normBalance = normalize(netBalance, ...balanceRange);
  const normTransactions = normalize(netTransactions, ...transactionRange);
  const normInvoice = normalize(-invoiceImpact, ...invoiceRange);
  const normRefund = normalize(refundImpact, ...refundRange);

  // Weights
  const weights = {
    balance: 0.5,
    transactions: 0.5,
    invoice: 0.5,
    refund: 0.5,
  };

  // Calculate score
  const score =
    (normBalance * weights.balance +
      normTransactions * weights.transactions +
      normInvoice * weights.invoice +
      normRefund * weights.refund) *
    100;

  return score.toFixed(2);
}

/**
 *
 * @param {models.Record} contact
 * @param {boolean} saveRecord
 */
const ensureContactStatistics = (contact, saveRecord = false) => {
  $app.dao().expandRecord(contact, ["statistics"]);
  let existingStats = contact.expandedOne("statistics");

  console.log(
    "=================ENSURE",
    contact.getString("name"),
    JSON.stringify(existingStats)
  );

  if (existingStats === null) {
    const collection = $app.dao().findCollectionByNameOrId("statistics");
    const statistic = new Record(collection, {
      balanceHistory: calculatePastBalanceHistory(contact),
    });
    console.log(">>>> SET", JSON.stringify(statistic));
    $app.dao().saveRecord(statistic);
    contact.set("statistics", statistic.getId());
    if (saveRecord) $app.dao().saveRecord(contact);
  }

  return contact;
};

/**
 *
 * @param {models.Record} contact
 * @returns {Array}
 */
const calculatePastBalanceHistory = (contact) => {
  let balance = 0;
  const history = [
    {
      date: contact.getCreated().string(),
      balance: 0,
    },
  ];
  const transactions = getTransactionsByContactId(contact.getId()).filter(
    (t) => isInvoice(t) || isRefund(t)
  );

  transactions.forEach((t) => {
    balance = isInvoice(t)
      ? balance - t.getInt("amount")
      : balance + t.getInt("amount");

    history.push({
      date: t.getDateTime("date").string(),
      balance,
    });
    console.log(
      balance,
      t.getInt("amount"),
      t.getString("type"),
      t.getDateTime("date")
    );
  });
  history.push({
    date: new Date().toISOString(),
    balance: contact.getInt("balance"),
  });
  return history;
};

/**
 *
 * @param {models.Record} contact
 */
const pushContactHistory = (contact) => {
  const balance = contact.getInt("balance");

  let statistics = null

  try {
    statistics = JSON.parse(contact.get("statistics") || {});
  } catch (error) {}

  if (!statistics)
    statistics = {
      balanceHistory: [],
    };

  if (!statistics?.balanceHistory) statistics.balanceHistory = [];

  statistics.balanceHistory.push({
    date: new Date().toISOString(),
    balance,
  });

  contact.set("statistics", JSON.stringify(statistics));
  return contact
};

module.exports = {
  calculateContactScore,
  pushContactHistory,
  ensureContactStatistics,
};
