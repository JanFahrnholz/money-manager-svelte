interface DataItem {
  date: Date;
}

export default class Statistics<T extends DataItem> {
  protected data: T[];
  static dateRangeStart: Date;
  static dateRangeEnd: Date = new Date();

  constructor(data: T[]) {
    this.data = data;
    Statistics.setLastNDays(30);
  }

  getData = (
    startDate: Date = Statistics.dateRangeStart,
    endDate: Date = Statistics.dateRangeEnd
  ) => {
    return this.data.filter(
      (item) =>
        new Date(item.date).getTime() >= startDate.getTime() &&
        new Date(item.date).getTime() <= endDate.getTime()
    );
  };

  static setLastNDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    Statistics.dateRangeStart = date;
  };
}
