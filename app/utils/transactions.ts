export const isIncome = (transaction) =>
  transaction?.type === "Income" || transaction?.type === "Einnahme";
export const isExpense = (transaction) =>
  transaction?.type === "Expense" || transaction?.type === "Ausgabe";
export const isInvoice = (transaction) =>
  transaction?.type === "Invoice" || transaction?.type === "Rechnung";
export const isRefund = (transaction) =>
  transaction?.type === "Refund" || transaction?.type === "Rückzahlung";
export const isCollect = (transaction) =>
  transaction?.type === "Collect"
export const isRestock = (transaction) =>
  transaction?.type === "Restock"
export const isRedeem = (transaction) =>
  transaction?.type === "Redeem"