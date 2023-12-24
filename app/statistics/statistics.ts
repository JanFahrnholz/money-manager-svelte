interface DataItem {
  date: Date;
}

export default class Statistics<T extends DataItem> {
  protected data: T[];
  static dateRangeStart?: Date = null;
  static dateRangeEnd: Date = new Date();

  constructor(data: T[]) {
    this.data = data ? data : [];
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
    Statistics.dateRangeEnd = new Date()
  };

  static getLastNDays = () => {
    if(Statistics.dateRangeStart === null) return 0;
    const date = new Date();
    const dateStart = new Date(Statistics.dateRangeStart);
    const diff = date.getTime() - dateStart.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };
}
