import { Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionType } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [DecimalPipe, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, TranslateModule],
  template: `
    <ion-grid>
      <ion-row>
        <ion-col size="6">
          <ion-card class="stat-card">
            <ion-card-header>
              <ion-card-title style="color: #2dd36f; font-size: 14px;">
                {{ 'transaction.income' | translate }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="stat-value" style="color: #2dd36f;">{{ incomeSum() | number: '1.2-2' }}</div>
              <div class="stat-count">{{ incomeCount() }}x</div>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <ion-col size="6">
          <ion-card class="stat-card">
            <ion-card-header>
              <ion-card-title style="color: #eb445a; font-size: 14px;">
                {{ 'transaction.expense' | translate }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="stat-value" style="color: #eb445a;">{{ expenseSum() | number: '1.2-2' }}</div>
              <div class="stat-count">{{ expenseCount() }}x</div>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
      <ion-row>
        <ion-col size="6">
          <ion-card class="stat-card">
            <ion-card-header>
              <ion-card-title style="color: #e0ac08; font-size: 14px;">
                {{ 'transaction.invoice' | translate }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="stat-value" style="color: #e0ac08;">{{ invoiceSum() | number: '1.2-2' }}</div>
              <div class="stat-count">{{ invoiceCount() }}x</div>
            </ion-card-content>
          </ion-card>
        </ion-col>
        <ion-col size="6">
          <ion-card class="stat-card">
            <ion-card-header>
              <ion-card-title style="color: #c9a81e; font-size: 14px;">
                {{ 'score' | translate }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="stat-value" style="color: #c9a81e;">{{ score() }}</div>
            </ion-card-content>
          </ion-card>
        </ion-col>
      </ion-row>
    </ion-grid>
  `,
  styles: `
    .stat-card {
      margin: 4px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 700;
    }
    .stat-count {
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-top: 2px;
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
      .filter((t) => t.type === TransactionType.Invoice)
      .reduce((sum, t) => sum + t.amount, 0),
  );
  readonly invoiceCount = computed(
    () => this.transactions().filter((t) => t.type === TransactionType.Invoice).length,
  );
}
