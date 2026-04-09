import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'txIcon', standalone: true })
export class TransactionTypeIconPipe implements PipeTransform {
  transform(type: string): string {
    const map: Record<string, string> = {
      Income: 'arrow-down-circle',
      Expense: 'arrow-up-circle',
      Credit: 'document-text',
      Invoice: 'document-text',
      Refund: 'return-down-back',
      Restock: 'cube',
      Collect: 'cash-outline',
      Redeem: 'gift',
    };
    return map[type] || 'swap-horizontal';
  }
}
