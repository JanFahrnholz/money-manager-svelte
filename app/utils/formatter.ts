import {isDateToday} from "./functions";

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