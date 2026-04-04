import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { PocketbaseService } from '../../../../core/services/pocketbase.service';
import { ContactService } from '../../../contacts/services/contact.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { TransactionType } from '../../../../core/models/transaction.model';
import type { Transaction } from '../../../../core/models/transaction.model';
import {
  TimeframeSelectorComponent,
  type Timeframe,
  getStartDate,
} from '../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { BalanceCardComponent } from '../../components/balance-card/balance-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
    TranslateModule,
    TimeframeSelectorComponent,
    BalanceCardComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>MoneyManager</ion-title>
        <div slot="end" class="status-dot-wrapper">
          <span
            class="status-dot"
            [class.online]="pb.online()"
            [title]="pb.online() ? ('online' | translate) : ('offline' | translate)"
          ></span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Timeframe selector -->
      <app-timeframe-selector (change)="onTimeframeChange($event)" />

      <!-- Main balance -->
      <div class="main-balance">
        <div class="balance-label">{{ 'balance' | translate }}</div>
        <div class="balance-value">
          {{ auth.user()?.balance ?? 0 | number: '1.2-2' }}
        </div>
      </div>

      <!-- Claims / Debts cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <app-balance-card
              [label]="'claims'"
              [value]="claims()"
              color="#2dd36f"
              prefix="+"
              borderColor="#2dd36f"
            />
          </ion-col>
          <ion-col size="6">
            <app-balance-card
              [label]="'debts'"
              [value]="debts()"
              color="#eb445a"
              prefix="-"
              borderColor="#eb445a"
            />
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Planned transactions -->
      @if (planned().length > 0) {
        <div class="section">
          <h3 class="section-title">{{ 'planned' | translate }}</h3>
          <ion-list>
            @for (tx of planned(); track tx.id) {
              <ion-item>
                <ion-label>
                  <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                  <p>{{ tx.date | date: 'mediumDate' }}@if (tx.info) { &mdash; {{ tx.info }} }</p>
                </ion-label>
                <ion-note slot="end">
                  {{ tx.amount | number: '1.2-2' }}
                </ion-note>
                <ion-button
                  slot="end"
                  fill="clear"
                  size="small"
                  color="success"
                  (click)="confirmPlanned(tx.id)"
                >
                  <ion-icon slot="icon-only" name="checkmark-circle" />
                </ion-button>
              </ion-item>
            }
          </ion-list>
        </div>
      }

      <!-- Recent transactions -->
      <div class="section">
        <h3 class="section-title">{{ 'recent' | translate }}</h3>
        <ion-list>
          @for (tx of recentFiltered(); track tx.id) {
            <ion-item [routerLink]="['/tabs/contacts', tx.contact]" detail="true">
              <ion-label>
                <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                <p>{{ tx.date | date: 'mediumDate' }}@if (tx.info) { &mdash; {{ tx.info }} }</p>
              </ion-label>
              <ion-note
                slot="end"
                [color]="txColor(tx.type)"
              >
                {{ txSign(tx.type) }}{{ tx.amount | number: '1.2-2' }}
              </ion-note>
            </ion-item>
          }
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: `
    .status-dot-wrapper {
      display: flex;
      align-items: center;
      padding-right: 16px;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: var(--ion-color-medium);
      display: inline-block;
    }
    .status-dot.online {
      background-color: #2dd36f;
    }
    .main-balance {
      text-align: center;
      padding: 20px 0 16px;
    }
    .balance-label {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ion-color-medium);
    }
    .balance-value {
      font-size: 40px;
      font-weight: 700;
      color: #ffd600;
      margin-top: 4px;
    }
    .section {
      margin-top: 20px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      margin: 0 0 8px;
    }
  `,
})
export class DashboardPage implements OnInit {
  readonly timeframe = signal<Timeframe>('1m');
  readonly recent = signal<Transaction[]>([]);
  readonly planned = signal<Transaction[]>([]);

  readonly claims = computed(() => {
    return this.contactService.contacts()
      .filter((c) => c.balance > 0)
      .reduce((sum, c) => sum + c.balance, 0);
  });

  readonly debts = computed(() => {
    return this.contactService.contacts()
      .filter((c) => c.balance < 0)
      .reduce((sum, c) => sum + Math.abs(c.balance), 0);
  });

  readonly recentFiltered = computed(() => {
    const txs = this.recent();
    const start = getStartDate(this.timeframe());
    if (!start) return txs;
    const startStr = start.toISOString();
    return txs.filter((t) => t.date >= startStr);
  });

  constructor(
    readonly auth: AuthService,
    readonly pb: PocketbaseService,
    private contactService: ContactService,
    private txService: TransactionService,
  ) {
    addIcons({ checkmarkCircle });
  }

  ngOnInit(): void {
    this.contactService.loadAll();
    this.txService.loadRecent(50).then((txs) => this.recent.set(txs));
    this.txService.loadPlanned().then((txs) => this.planned.set(txs));
  }

  onTimeframeChange(tf: Timeframe): void {
    this.timeframe.set(tf);
  }

  async confirmPlanned(id: string): Promise<void> {
    await this.txService.confirmPlanned(id);
    this.planned.update((list) => list.filter((t) => t.id !== id));
    this.txService.loadRecent(50).then((txs) => this.recent.set(txs));
  }

  txTypeKey(type: TransactionType): string {
    switch (type) {
      case TransactionType.Income:
        return 'income';
      case TransactionType.Expense:
        return 'expense';
      case TransactionType.Invoice:
        return 'invoice';
      case TransactionType.Refund:
        return 'refund';
      case TransactionType.Restock:
        return 'income';
      case TransactionType.Collect:
        return 'expense';
      case TransactionType.Redeem:
        return 'expense';
      default:
        return 'income';
    }
  }

  txColor(type: TransactionType): string {
    if (type === TransactionType.Income || type === TransactionType.Refund) {
      return 'success';
    }
    return 'danger';
  }

  txSign(type: TransactionType): string {
    if (type === TransactionType.Income || type === TransactionType.Refund) {
      return '+';
    }
    return '-';
  }
}
