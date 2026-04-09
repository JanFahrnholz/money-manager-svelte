import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonBadge,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  arrowDownCircle,
  arrowUpCircle,
  documentText,
  returnDownBack,
  cube,
  cashOutline,
  gift,
  swapHorizontal,
} from 'ionicons/icons';
import { UserService } from '../../../../core/services/user.service';
import { RelayService } from '../../../../core/services/relay.service';
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { ContactService } from '../../../contacts/services/contact.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { TransactionType } from '../../../../core/models/transaction.model';
import type { Transaction } from '../../../../core/models/transaction.model';
import {
  TimeframeSelectorComponent,
  type Timeframe,
  getStartDate,
  getMonthRange,
} from '../../../../shared/components/timeframe-selector/timeframe-selector.component';
import { BalanceCardComponent } from '../../components/balance-card/balance-card.component';
import { TransactionTypeIconPipe } from '../../../../shared/pipes/transaction-type-icon.pipe';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
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
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonBadge,
    IonCard,
    IonCardContent,
    TranslateModule,
    TimeframeSelectorComponent,
    BalanceCardComponent,
    TransactionTypeIconPipe,
    EuroPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>MoneyManager</ion-title>
        <div slot="end" class="status-dot-wrapper">
          <span
            class="status-dot"
            [class.online]="relay.online()"
            [title]="relay.online() ? ('online' | translate) : ('offline' | translate)"
          ></span>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else {
        <!-- Timeframe selector -->
        <app-timeframe-selector (change)="onTimeframeChange($event)" (monthChange)="onMonthChange($event)" />

        <!-- Main balance -->
        <div class="main-balance">
          <div class="balance-label">{{ 'balance' | translate }}</div>
          <div class="balance-value">
            {{ auth.user()?.balance ?? 0 | euro }}
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

        <!-- Agent Cards -->
        @if (agentCards().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.dashboard' | translate }}</h3>
            @for (card of agentCards(); track card.pairId) {
              <ion-card button [routerLink]="['/tabs/dashboard/agent', card.pairId]" class="agent-card" style="margin:0 0 12px;">
                <ion-card-content>
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:16px;font-weight:700;color:#fff;">Agent bei {{ card.label }}</div>
                      <div style="font-size:12px;color:#888;margin-top:2px;">{{ card.contactCount }} {{ 'network.contacts' | translate }}</div>
                    </div>
                    <div style="text-align:right;">
                      <div style="font-size:11px;color:#888;">{{ 'courier.inventory' | translate }}</div>
                      <div style="font-size:18px;font-weight:700;color:#ffd600;">{{ card.inventory | euro }}</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:16px;margin-top:10px;">
                    <div>
                      <div style="font-size:11px;color:#888;">{{ 'courier.sales' | translate }}</div>
                      <div style="font-size:14px;font-weight:600;color:#4cd964;">{{ card.sales | euro }}</div>
                    </div>
                    <div>
                      <div style="font-size:11px;color:#888;">{{ 'courier.bonus' | translate }}</div>
                      <div style="font-size:14px;font-weight:600;color:#ff9500;">{{ card.bonus | euro }}</div>
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }

        <!-- Planned transactions -->
        @if (planned().length > 0) {
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">{{ 'planned' | translate }}</h3>
              <a class="section-link" [routerLink]="['/tabs/transactions/planned']">{{ 'planned.showAll' | translate }}</a>
            </div>
            <ion-list>
              @for (tx of planned(); track tx.id) {
                <ion-item>
                  <ion-label>
                    <h3>{{ contactNameMap()[tx.contact] || '' }} &middot; {{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                    <p [style.color]="isOverdue(tx.date) ? '#ff3b30' : ''">
                      {{ tx.date | date:'dd.MM.yyyy' }}
                      @if (isOverdue(tx.date)) {
                        <ion-badge color="danger" style="margin-left:8px;">Überfällig</ion-badge>
                      }
                      @if (tx.info) { &mdash; {{ tx.info }} }
                    </p>
                  </ion-label>
                  <ion-note slot="end">
                    {{ tx.amount | euro }}
                  </ion-note>
                  <ion-button
                    slot="end"
                    fill="clear"
                    size="small"
                    color="success"
                    (click)="$event.stopPropagation(); confirmPlanned(tx.id)"
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
                <ion-icon [name]="tx.type | txIcon" slot="start" />
                <ion-label>
                  <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                  <p>{{ contactNameMap()[tx.contact] || '' }} &middot; {{ tx.date | date:'dd.MM.yy' }}@if (tx.info) { &mdash; {{ tx.info }} }</p>
                </ion-label>
                <ion-note
                  slot="end"
                  [color]="txColor(tx.type)"
                >
                  {{ txSign(tx.type) }}{{ tx.amount | euro }}
                </ion-note>
              </ion-item>
            }
          </ion-list>
        </div>
      }
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
      margin-top: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .section-header .section-title {
      margin: 0;
    }
    .section-link {
      color: var(--ion-color-primary);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 0 16px;
      margin: 0 0 8px;
    }
    .agent-card {
      --background: linear-gradient(135deg, rgba(255,214,0,0.08), rgba(255,214,0,0.02));
      border: 1px solid rgba(255,214,0,0.15);
      border-radius: 12px;
    }
  `,
})
export class DashboardPage implements OnInit {
  readonly loading = signal(true);
  readonly timeframe = signal<Timeframe>('max');
  readonly activeMonthRange = signal<{ start: Date; end: Date } | null>(null);
  readonly recent = signal<Transaction[]>([]);
  readonly planned = signal<Transaction[]>([]);
  readonly agentCards = signal<{ pairId: string; label: string; inventory: number; sales: number; bonus: number; contactCount: number }[]>([]);

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
    const mr = this.activeMonthRange();
    if (this.timeframe() === 'month' && mr) {
      const startStr = mr.start.toISOString();
      const endStr = mr.end.toISOString();
      return txs.filter((t) => t.date >= startStr && t.date <= endStr).slice(0, 20);
    }
    const start = getStartDate(this.timeframe());
    if (!start) return txs.slice(0, 20);
    const startStr = start.toISOString();
    return txs.filter((t) => t.date >= startStr).slice(0, 20);
  });

  readonly contactNameMap = computed(() => {
    const map: Record<string, string> = {};
    for (const c of this.contactService.contacts()) {
      map[c.id] = c.name;
    }
    return map;
  });

  constructor(
    readonly auth: UserService,
    readonly relay: RelayService,
    private contactService: ContactService,
    private txService: TransactionService,
    private deviceService: DeviceService,
    private sqlite: SqliteService,
  ) {
    addIcons({ checkmarkCircle, arrowDownCircle, arrowUpCircle, documentText, returnDownBack, cube, cashOutline, gift, swapHorizontal });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.loadData();
    this.loading.set(false);
  }

  async doRefresh(event: any): Promise<void> {
    await this.loadData();
    event.target.complete();
  }

  private async loadData(): Promise<void> {
    await Promise.all([
      this.contactService.loadAll(),
      this.txService.loadRecent(50).then((txs) => this.recent.set(txs)),
      this.txService.loadPlanned().then((txs) => this.planned.set(txs)),
      this.loadAgentCards(),
    ]);
  }

  private async loadAgentCards(): Promise<void> {
    const pairs = this.deviceService.pairs().filter(p => p.role === 'courier');
    const cards = [];
    for (const pair of pairs) {
      const remoteContacts = await this.sqlite.query<any>(
        'SELECT COUNT(*) as cnt FROM remote_contacts WHERE pairId = ?', [pair.id]
      );
      const links = await this.sqlite.query<any>(
        'SELECT inventoryBalance, salesBalance, bonusBalance FROM courier_links WHERE courier = ?',
        [this.auth.user()!.id]
      );
      const link = links[0];
      cards.push({
        pairId: pair.id,
        label: pair.label || 'Manager',
        inventory: link?.inventoryBalance ?? 0,
        sales: link?.salesBalance ?? 0,
        bonus: link?.bonusBalance ?? 0,
        contactCount: remoteContacts[0]?.cnt ?? 0,
      });
    }
    this.agentCards.set(cards);
  }

  onTimeframeChange(tf: Timeframe): void {
    this.timeframe.set(tf);
    if (tf !== 'month') this.activeMonthRange.set(null);
  }

  onMonthChange(event: { month: number; year: number }): void {
    this.activeMonthRange.set(getMonthRange(event.month, event.year));
    this.timeframe.set('month');
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

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
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
