import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionType } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [DecimalPipe, EuroPipe, IonCard, IonCardHeader, IonCardTitle, IonCardContent, TranslateModule],
  template: `
    <div class="stats-grid">
      <ion-card style="border-left: 3px solid #4cd964;">
        <ion-card-content>
          <div class="stat-label" style="color: #4cd964;">{{ 'transaction.income' | translate }}</div>
          <div class="stat-value" style="color: #4cd964;">{{ incomeSum() | euro }}</div>
          <div class="stat-count">{{ incomeCount() }}x</div>
        </ion-card-content>
      </ion-card>
      <ion-card style="border-left: 3px solid #ff3b30;">
        <ion-card-content>
          <div class="stat-label" style="color: #ff3b30;">{{ 'transaction.expense' | translate }}</div>
          <div class="stat-value" style="color: #ff3b30;">{{ expenseSum() | euro }}</div>
          <div class="stat-count">{{ expenseCount() }}x</div>
        </ion-card-content>
      </ion-card>
      <ion-card style="border-left: 3px solid #ff9500;">
        <ion-card-content>
          <div class="stat-label" style="color: #ff9500;">{{ 'transaction.credit' | translate }}</div>
          <div class="stat-value" style="color: #ff9500;">{{ invoiceSum() | euro }}</div>
          <div class="stat-count">{{ invoiceCount() }}x</div>
        </ion-card-content>
      </ion-card>
      <ion-card style="border-left: 3px solid #ffd600;">
        <ion-card-content>
          <div class="stat-label" style="color: #ffd600;">{{ 'score' | translate }}</div>
          <div class="stat-value" [style.color]="score() > 0 ? '#4cd964' : score() < 0 ? '#ff3b30' : '#ffd600'">{{ score() | number:'1.0-0' }}</div>
        </ion-card-content>
      </ion-card>
    </div>
  `,
  styles: `
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding: 0 16px;
    }
    .stats-grid ion-card {
      margin: 0;
      min-height: 90px;
      display: flex;
    }
    .stats-grid ion-card-content {
      flex: 1;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      margin: 4px 0;
    }
    .stat-count {
      font-size: 11px;
      color: #555;
    }
  `,
})
export class StatsCardsComponent {
  readonly transactions = input.required<Transaction[]>();
  readonly score = input(0);

  readonly incomeSum = computed(() =>
    this.transactions()
      .filter((t) => t.type === TransactionType.Income)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  readonly incomeCount = computed(
    () => this.transactions().filter((t) => t.type === TransactionType.Income).length,
  );

  readonly expenseSum = computed(() =>
    this.transactions()
      .filter((t) => t.type === TransactionType.Expense)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  readonly expenseCount = computed(
    () => this.transactions().filter((t) => t.type === TransactionType.Expense).length,
  );

  readonly invoiceSum = computed(() =>
    this.transactions()
      .filter((t) => t.type === TransactionType.Credit)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  readonly invoiceCount = computed(
    () => this.transactions().filter((t) => t.type === TransactionType.Credit).length,
  );
}
