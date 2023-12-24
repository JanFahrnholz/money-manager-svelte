import {Transaction} from "../transactions/types/transaction";

export function groupByProperty(array, property) {
  return array.reduce((grouped, item) => {
    const key = item[property];
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
    return grouped;
  }, {});
}

export const renderDailyDivider = (index, list) => {
  if (index === 0) return true;

  const current = list[index];
  const previous = list[index - 1];

  if (new Date(current.date).getDay() !== new Date(previous.date).getDay())
    return true;
  return false;
};

export function getMonthStartAndEndDates(transactions: Transaction[]) {
  const monthStartAndEndDates = {};

  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.date);
    const monthYear = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;

    // If the monthYear key doesn't exist, initialize it with the start and end dates
    if (!monthStartAndEndDates[monthYear]) {
      const firstDayOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
      const lastDayOfMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth() + 1, 0);

      monthStartAndEndDates[monthYear] = {
        key: monthYear,
        label: `${firstDayOfMonth.toLocaleDateString("en-US", {month: "long", year: "numeric"})}`,
        start: firstDayOfMonth.toISOString(),
        end: lastDayOfMonth.toISOString(),
      };
    }
  }

  return monthStartAndEndDates;
}

export function isDateToday(inputDate) {
  const today = new Date();
  const inputDateObj = new Date(inputDate);

  // Set hours, minutes, seconds, and milliseconds to zero for accurate comparison
  today.setHours(0, 0, 0, 0);
  inputDateObj.setHours(0, 0, 0, 0);

  return today.getTime() === inputDateObj.getTime();
}