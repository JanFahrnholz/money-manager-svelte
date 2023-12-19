export const formatDailyDate = (date: Date) =>
  new Date(date).toLocaleDateString("default", {
    day: "2-digit",
    month: "long",
  });

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
