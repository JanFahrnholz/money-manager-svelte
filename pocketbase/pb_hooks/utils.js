/**
 *
 * @param {models.Record} record
 * @param {number} modifier
 */
const modifyBalance = (record, modifier, attribute = "balance") => {
  console.log(
    "Modifed balance value",
    record.getInt(attribute),
    modifier, "=",
    record.getInt(attribute) + modifier
  );
  record.set(attribute, record.getInt(attribute) + modifier);
  return record;
};

/**
 *
 * @param {string} id
 * @returns {models.record[]}
 */
const getTransactionsByContactId = (id) => {
  return $app
    .dao()
    .findRecordsByFilter("transactions", "contact = {:id}", "date", 0, 0, {
      id,
    });
};

function isMoreThanXDaysAgo(inputDate, days) {
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const inputDateObj = new Date(inputDate);
  const currentDate = new Date();

  const differenceInDays = Math.floor(
    (currentDate - inputDateObj) / millisecondsInDay
  );

  return differenceInDays > days;
}
/**
 * Enum for common colors.
 * @readonly
 * @enum {{names: string[]}}
 */
const TYPES = Object.freeze({
  INCOME: { names: ["Income", "Einnahme"] },
  EXPENSE: { names: ["Expense", "Ausgabe"] },
  INVOICE: { names: ["Invoice", "Rechnung"] },
  REFUND: { names: ["Refund", "Rückzahlung"] },
  RESTOCK: { names: ["Restock"] },
  COLLECT: { names: ["Collect"] },
  REDEEM: { names: ["Redeem"] },
});

/** 
 * @param {TYPES} type
 */
isType = (transaction, type) => {
  if (transaction?.type) {
    return type.names.includes(transaction.type);
  }

  try {
    return type.names.includes(transaction?.get("type"))
  } catch (e) {
    return false
  }
};
const isIncome = (transaction) => isType(transaction, TYPES.INCOME);
const isExpense = (transaction) => isType(transaction, TYPES.EXPENSE);
const isInvoice = (transaction) => isType(transaction, TYPES.INVOICE);
const isRefund = (transaction) => isType(transaction, TYPES.REFUND);
const isRestock = (transaction) => isType(transaction, TYPES.RESTOCK);
const isCollect = (transaction) => isType(transaction, TYPES.COLLECT);
const isRedeem = (transaction) => isType(transaction, TYPES.REDEEM);

module.exports = {
  modifyBalance,
  isMoreThanXDaysAgo,
  getTransactionsByContactId,
  isIncome,
  isExpense,
  isInvoice,
  isRefund,
  isRestock,
  isCollect,
  isRedeem,
  TYPES,
};
