import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'euro', standalone: true })
export class EuroPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0,00\u202F\u20AC';
    const formatted = value.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted}\u202F\u20AC`;
  }
}
