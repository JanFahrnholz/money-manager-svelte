import { _ } from "svelte-i18n";
import {isDateToday} from "./functions";
import { isCollect, isExpense, isIncome, isInvoice, isRedeem, isRefund, isRestock } from "./transactions";

export const formatDailyDate = (date: Date) =>{
    const year = new Date(date).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
  return new Date(date).toLocaleDateString("default", {
    day: "2-digit",
    month: "long",
    year
  });
}

export const formatMonthlyDate = (date: Date) =>
  `${new Date(date).toLocaleDateString("default", {
    month: "long",
    year: "numeric",
  })}`;

export const formatMonthlyExact = (date: Date) =>
  `${new Date(date).toLocaleDateString("default", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

export const formatTime = (date) =>
  new Date(date).toLocaleTimeString("default", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateRange = (date) => {
    if (isDateToday(date)) return "today"

    return new Date(date).toLocaleDateString("default", {
        day: "2-digit",
        month: "long",
    })
}

export const formatTransactionType = (format ,transaction, long = false) => {
  if(isIncome(transaction)) return format("transaction.type.income");
  if(isExpense(transaction)) return format("transaction.type.expense");
  if(isInvoice(transaction)) return format("transaction.type.invoice");
  if(isRefund(transaction)) return format("transaction.type.refund");
  if(isRestock(transaction)) return format(`transaction.type.restock${long ? ".long" : ""}`);
  if(isCollect(transaction)) return format(`transaction.type.collect${long ? ".long" : ""}`);
  if(isRedeem(transaction)) return format(`transaction.type.redeem${long ? ".long" : ""}`);
}