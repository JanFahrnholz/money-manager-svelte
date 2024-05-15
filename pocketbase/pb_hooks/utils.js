
const calculateContactScore = (contact) => {
    let score = 1000;

    const balance = contact.getInt("balance");

    if(balance < 0) score -= 10
    if(balance < -50) score -= 10
    if(balance < -100) score -= 10

    return score;
}

function isMoreThanXDaysAgo(inputDate, days) {
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    const inputDateObj = new Date(inputDate);
    const currentDate = new Date();

    const differenceInDays = Math.floor((currentDate - inputDateObj) / millisecondsInDay);

    return differenceInDays > days;
}

const isIncome = (transaction) =>
    transaction.type === "Income" || transaction.type === "Einnahme" || transaction.get("type") === "Income" || transaction.get("type") === "Einnahme";
const isExpense = (transaction) =>
    transaction.type === "Expense" || transaction.type === "Ausgabe" || transaction.get("type") === "Expense" || transaction.get("type") === "Ausgabe";
const isInvoice = (transaction) =>
    transaction.type === "Invoice" || transaction.type === "Rechnung" || transaction.get("type") === "Invoice" || transaction.get("type") === "Rechnung";
const isRefund = (transaction) =>
    transaction.type === "Refund" || transaction.type === "Rückzahlung" || transaction.get("type") === "Refund" || transaction.get("type") === "Rückzahlung";

module.exports = {
    calculateContactScore,
    isMoreThanXDaysAgo,
    isIncome,
    isExpense,
    isInvoice,
    isRefund
}