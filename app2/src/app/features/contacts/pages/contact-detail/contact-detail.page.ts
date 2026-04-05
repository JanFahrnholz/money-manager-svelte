import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonAvatar,
  IonActionSheet,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import type { Contact } from '../../../../core/models/contact.model';
import type { Transaction } from '../../../../core/models/transaction.model';
import { TransactionType } from '../../../../core/models/transaction.model';
import {
  TimeframeSelectorComponent,
  type Timeframe,
  getStartDate,
} from '../../../../shared/components/timeframe-selector/timeframe-selector.component';
import {
  BalanceGraphComponent,
  type BalancePoint,
} from '../../components/balance-graph/balance-graph.component';
import { StatsCardsComponent } from '../../components/stats-cards/stats-cards.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonAvatar,
    IonActionSheet,
    TranslateModule,
    TimeframeSelectorComponent,
    BalanceGraphComponent,
    StatsCardsComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/contacts" />
        </ion-buttons>
        <ion-title>{{ contact()?.name ?? '' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showActions.set(true)">
            <ion-icon slot="icon-only" name="ellipsis-horizontal" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (contact(); as c) {
        <!-- Avatar + Name + Balance -->
        <div class="contact-header">
          <ion-avatar class="avatar-lg">
            <div
              [style.background-color]="avatarColor()"
              class="avatar-inner"
            >
              {{ initial() }}
            </div>
          </ion-avatar>
          <h2 class="contact-name">{{ c.name }}</h2>
          <h1 class="contact-balance" [style.color]="balanceTextColor()">
            {{ c.balance | number: '1.2-2' }}
          </h1>
          <p class="contact-score">{{ 'score' | translate }}: {{ c.score }}</p>
        </div>

        <!-- New Transaction button -->
        <ion-button
          expand="block"
          fill="outline"
          [routerLink]="['/tabs/transactions/create']"
          [queryParams]="{ contactId: c.id }"
          class="new-tx-btn"
        >
          {{ 'transaction.create' | translate }}
        </ion-button>

        <!-- Timeframe Selector -->
        <app-timeframe-selector (change)="onTimeframeChange($event)" />

        <!-- Balance Graph -->
        <div class="section">
          <h3 class="section-title">{{ 'contact.history' | translate }}</h3>
          <app-balance-graph [data]="graphData()" />
        </div>

        <!-- Stats Cards -->
        <div class="section">
          <h3 class="section-title">{{ 'contact.stats' | translate }}</h3>
          <app-stats-cards [transactions]="filteredTransactions()" [score]="c.score" />
        </div>

        <!-- Transaction List -->
        <div class="section">
          <h3 class="section-title">{{ 'contact.transactions' | translate }}</h3>
          <ion-list>
            @for (tx of filteredTransactions(); track tx.id) {
              <ion-item>
                <ion-label>
                  <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                  <p>{{ tx.date | date: 'dd.MM.yyyy' }}@if (tx.info) { &mdash; {{ tx.info }} }</p>
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
      }

      <ion-action-sheet
        [isOpen]="showActions()"
        [header]="contact()?.name ?? ''"
        [buttons]="actionButtons()"
        (didDismiss)="showActions.set(false)"
      />
    </ion-content>
  `,
  styles: `
    .contact-header {
      text-align: center;
      padding: 16px 0 8px;
    }
    .avatar-lg {
      width: 72px;
      height: 72px;
      margin: 0 auto 8px;
    }
    .avatar-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      color: #fff;
      font-weight: 600;
      font-size: 1.6rem;
    }
    .contact-name {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .contact-balance {
      margin: 4px 0 0;
      font-size: 32px;
      font-weight: 700;
    }
    .contact-score {
      margin: 2px 0 0;
      font-size: 13px;
      color: var(--ion-color-medium);
    }
    .new-tx-btn {
      margin: 12px 0;
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
export class ContactDetailPage implements OnInit {
  readonly contact = signal<Contact | null>(null);
  readonly allTransactions = signal<Transaction[]>([]);
  readonly timeframe = signal<Timeframe>('1m');
  readonly showActions = signal(false);

  readonly filteredTransactions = computed(() => {
    const txs = this.allTransactions();
    const start = getStartDate(this.timeframe());
    if (!start) return txs;
    const startStr = start.toISOString();
    return txs.filter((t) => t.date >= startStr);
  });

  readonly graphData = computed<BalancePoint[]>(() => {
    const txs = this.filteredTransactions().slice().reverse(); // chronological order
    let balance = 0;
    return txs.map((t) => {
      if (t.type === TransactionType.Invoice) balance -= t.amount;
      if (t.type === TransactionType.Refund) balance += t.amount;
      return { date: t.date, balance };
    });
  });

  readonly initial = computed(() => {
    const name = this.contact()?.name ?? '';
    return name ? name.charAt(0).toUpperCase() : '?';
  });

  readonly avatarColor = computed(() => {
    const balance = this.contact()?.balance ?? 0;
    if (balance > 0) return '#2dd36f';
    if (balance < 0) return '#eb445a';
    return '#c9a81e';
  });

  readonly balanceTextColor = computed(() => {
    const balance = this.contact()?.balance ?? 0;
    if (balance > 0) return '#2dd36f';
    if (balance < 0) return '#eb445a';
    return '#c9a81e';
  });

  readonly actionButtons = computed(() => [
    {
      text: this.translate.instant('edit'),
      role: 'edit' as const,
      handler: () => {
        // Edit handled via role if needed
      },
    },
    {
      text: this.translate.instant('delete'),
      role: 'destructive' as const,
      handler: () => {
        this.confirmDelete();
      },
    },
    {
      text: this.translate.instant('cancel'),
      role: 'cancel' as const,
    },
  ]);

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private contactService: ContactService,
    private txService: TransactionService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
  ) {
    addIcons({ ellipsisHorizontal });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;

    this.contactService.getById(id).then((c) => {
      if (c) this.contact.set(c);
    });

    this.txService.loadByContact(id, 200).then((txs) => {
      this.allTransactions.set(txs);
    });
  }

  onTimeframeChange(tf: Timeframe): void {
    this.timeframe.set(tf);
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

  private async confirmDelete(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Kontakt löschen?',
      message: 'Bist du sicher?',
      buttons: [
        'Abbrechen',
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            this.deleteContact();
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteContact(): Promise<void> {
    const c = this.contact();
    if (!c) return;
    await this.contactService.remove(c.id);
    this.navCtrl.back();
  }
}
