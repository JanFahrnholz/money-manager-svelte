interface DataItem {
  date: Date;
}

export default class Statistics<T extends DataItem> {
  protected data: T[];
  static dateRangeStart?: Date = null;
  static dateRangeEnd: Date = new Date();

  constructor(data: T[]) {
    this.data = data;
  }

  public getData(
    startDate: Date = Statistics.dateRangeStart,
    endDate: Date = Statistics.dateRangeEnd
  ) {
    if (startDate === null) return this.data;

    return this.data.filter(
      (item) =>
        new Date(item.date).getTime() >= startDate.getTime() &&
        new Date(item.date).getTime() <= endDate.getTime()
    );
  }

  getFirstEntry = () => {
    return this.data.at(-1);
  };

  getLastEntry = () => {
    return this.data.at(0);
  };

  static setLastNDays = (days: number) => {
    if (days === 0) {
      Statistics.dateRangeStart = null;
      return;
    }
    const date = new Date();
    date.setDate(date.getDate() - days);
    Statistics.dateRangeStart = date;
  };
}
