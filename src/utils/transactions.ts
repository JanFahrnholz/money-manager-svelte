export const isIncome = (transaction) =>
  transaction.type === "Income" || transaction.type === "Einnahme";
export const isExpense = (transaction) =>
  transaction.type === "Expense" || transaction.type === "Ausgabe";
export const isInvoice = (transaction) =>
  transaction.type === "Invoice" || transaction.type === "Rechnung";
export const isRefund = (transaction) =>
  transaction.type === "Refund" || transaction.type === "Rückzahlung";
