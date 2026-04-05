import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateGroup', standalone: true })
export class DateGroupPipe implements PipeTransform {
  transform(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (this.sameDay(date, today)) return 'Heute';
    if (this.sameDay(date, yesterday)) return 'Gestern';
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private sameDay(a: Date, b: Date): boolean {
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }
}
