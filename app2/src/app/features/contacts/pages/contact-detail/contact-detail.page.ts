import { Component, computed, OnInit, signal } from '@angular/core';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
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
  IonItemDivider,
  IonLabel,
  IonNote,
  IonAvatar,
  IonActionSheet,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  ellipsisHorizontal,
  arrowDownCircle,
  arrowUpCircle,
  documentText,
  returnDownBack,
  cube,
  cashOutline,
  gift,
  swapHorizontal,
} from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { TransactionService } from '../../../transactions/services/transaction.service';
import { CourierService } from '../../../couriers/services/courier.service';
import { UserService } from '../../../../core/services/user.service';
import { DeviceService } from '../../../../core/services/device.service';
import { EncryptedSyncService } from '../../../../core/services/encrypted-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { QrDisplayComponent } from '../../../../shared/components/qr-display/qr-display.component';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import type { Contact } from '../../../../core/models/contact.model';
import type { CourierLink } from '../../../../core/models/courier-link.model';
import type { Pair } from '../../../../core/models/pair.model';
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
import { DateGroupPipe } from '../../../../shared/pipes/date-group.pipe';
import { TransactionTypeIconPipe } from '../../../../shared/pipes/transaction-type-icon.pipe';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    EuroPipe,
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
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonModal,
    IonItemDivider,
    TranslateModule,
    TimeframeSelectorComponent,
    BalanceGraphComponent,
    StatsCardsComponent,
    TransactionTypeIconPipe,
    QrDisplayComponent,
    QrScannerComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/contacts" [text]="'back' | translate" />
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
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else if (contact(); as c) {
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
            {{ c.balance | euro }}
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
            @for (group of groupedTransactions(); track group.label) {
              <ion-item-divider>
                <ion-label>{{ group.label }}</ion-label>
              </ion-item-divider>
              @for (tx of group.transactions; track tx.id) {
                <ion-item button (click)="showTransactionActions(tx)">
                  <ion-icon [name]="tx.type | txIcon" slot="start" />
                  <ion-label>
                    <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                    <p>@if (tx.info) { {{ tx.info }} }</p>
                  </ion-label>
                  <ion-note
                    slot="end"
                    [color]="txColor(tx.type)"
                  >
                    {{ txSign(tx.type) }}{{ tx.amount | euro }}
                  </ion-note>
                </ion-item>
              }
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

      <ion-action-sheet
        [isOpen]="showTxActions()"
        [header]="txActionHeader()"
        [buttons]="txActionButtons()"
        (didDismiss)="showTxActions.set(false)"
      />

      <ion-modal [isOpen]="showQrModal()" (didDismiss)="showQrModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>QR-Code</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showQrModal.set(false)">Fertig</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding" style="text-align:center;">
            <p>{{ 'contact.qrScanPrompt' | translate }}</p>
            <app-qr-display [data]="qrPayload()" />
          </ion-content>
        </ng-template>
      </ion-modal>

      <ion-modal [isOpen]="showScanModal()" (didDismiss)="showScanModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Scannen</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showScanModal.set(false)">{{ 'cancel' | translate }}</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <app-qr-scanner (scanned)="onQrScanned($event)" />
          </ion-content>
        </ng-template>
      </ion-modal>
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
  readonly loading = signal(true);
  readonly contact = signal<Contact | null>(null);
  readonly allTransactions = signal<Transaction[]>([]);
  readonly timeframe = signal<Timeframe>('max');
  readonly showActions = signal(false);
  readonly selectedTransaction = signal<Transaction | null>(null);
  readonly showTxActions = signal(false);
  readonly courierLink = signal<CourierLink | null>(null);
  readonly pair = signal<Pair | null>(null);
  readonly showQrModal = signal(false);
  readonly showScanModal = signal(false);
  readonly qrPayload = signal('');

  readonly canMakeCourier = computed(() => {
    const c = this.contact();
    if (!c) return false;
    return c.owner === this.auth.user()?.id && !!c.user;
  });

  readonly filteredTransactions = computed(() => {
    const txs = this.allTransactions();
    const start = getStartDate(this.timeframe());
    if (!start) return txs;
    const startStr = start.toISOString();
    return txs.filter((t) => t.date >= startStr);
  });

  private readonly dateGroupPipe = new DateGroupPipe();

  readonly groupedTransactions = computed(() => {
    const txs = this.filteredTransactions();
    const groups: { label: string; transactions: Transaction[] }[] = [];
    let currentLabel = '';
    for (const tx of txs) {
      const label = this.dateGroupPipe.transform(tx.date);
      if (label !== currentLabel) {
        groups.push({ label, transactions: [] });
        currentLabel = label;
      }
      groups[groups.length - 1].transactions.push(tx);
    }
    return groups;
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

  readonly actionButtons = computed(() => {
    const buttons: any[] = [
      {
        text: this.translate.instant('contact.rename'),
        handler: () => {
          this.showRenameAlert();
        },
      },
    ];

    // QR pairing actions
    const existingPair = this.pair();
    if (!existingPair) {
      buttons.push({
        text: this.translate.instant('contact.showQr'),
        handler: () => {
          this.showLinkQr();
        },
      });
      buttons.push({
        text: this.translate.instant('contact.scanQr'),
        handler: () => {
          this.showScanModal.set(true);
        },
      });
    } else {
      buttons.push({
        text: this.translate.instant('contact.linked') + ' ' + existingPair.label,
        cssClass: 'action-sheet-info',
        handler: () => {},
      });
      buttons.push({
        text: this.translate.instant('contact.unlink'),
        role: 'destructive' as const,
        handler: () => {
          this.unlinkContact();
        },
      });
    }

    if (this.canMakeCourier() && !this.courierLink()) {
      buttons.push({
        text: this.translate.instant('courier.make'),
        handler: () => {
          this.makeCourier();
        },
      });
    }

    if (this.courierLink()) {
      buttons.push({
        text: this.translate.instant('courier.details'),
        handler: () => {
          this.navCtrl.navigateForward(`/tabs/profile/network/${this.courierLink()!.id}`);
        },
      });
      buttons.push({
        text: this.translate.instant('courier.remove'),
        role: 'destructive' as const,
        handler: () => {
          this.removeCourier();
        },
      });
    }

    buttons.push(
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
    );

    return buttons;
  });

  readonly txActionButtons = computed(() => {
    const tx = this.selectedTransaction();
    if (!tx) return [];
    return [
      {
        text: this.translate.instant('transaction.delete'),
        role: 'destructive' as const,
        handler: () => {
          this.confirmDeleteTransaction();
        },
      },
      {
        text: this.translate.instant('cancel'),
        role: 'cancel' as const,
      },
    ];
  });

  readonly txActionHeader = computed(() => {
    const tx = this.selectedTransaction();
    if (!tx) return '';
    const typeKey = this.txTypeKey(tx.type);
    const typeLabel = this.translate.instant('transaction.' + typeKey);
    return `${tx.amount}€ ${typeLabel}`;
  });

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private contactService: ContactService,
    private txService: TransactionService,
    private courierService: CourierService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private auth: UserService,
    private deviceService: DeviceService,
    private encryptedSync: EncryptedSyncService,
    private toast: ToastService,
  ) {
    addIcons({ ellipsisHorizontal, arrowDownCircle, arrowUpCircle, documentText, returnDownBack, cube, cashOutline, gift, swapHorizontal });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;

    this.loading.set(true);
    await this.loadData(id);
    this.loading.set(false);
  }

  async doRefresh(event: any): Promise<void> {
    const id = this.contact()?.id ?? this.route.snapshot.paramMap.get('id') ?? '';
    if (id) {
      await this.loadData(id);
    }
    event.target.complete();
  }

  private async loadData(id: string): Promise<void> {
    const [c, txs] = await Promise.all([
      this.contactService.getById(id),
      this.txService.loadByContact(id, 200),
    ]);
    if (c) this.contact.set(c);
    this.allTransactions.set(txs);

    // Check for existing QR pair
    if (c) {
      const existingPair = this.deviceService.getPairForContact(c.id);
      this.pair.set(existingPair ?? null);
    }

    // Load courier link if contact is linked to a user
    if (c?.user && c.owner === this.auth.user()?.id) {
      await this.loadCourierLink(c.user);
    } else {
      this.courierLink.set(null);
    }
  }

  private async loadCourierLink(courierUserId: string): Promise<void> {
    const links = await this.courierService.getByCourier(courierUserId);
    const currentUserId = this.auth.user()?.id;
    const link = links.find((l) => l.manager === currentUserId) ?? null;
    this.courierLink.set(link);
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

  private async showRenameAlert(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('contact.rename'),
      inputs: [{ name: 'name', type: 'text', value: this.contact()!.name }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        { text: this.translate.instant('save'), handler: (data: { name: string }) => this.renameContact(data.name) },
      ],
    });
    await alert.present();
  }

  private async renameContact(name: string): Promise<void> {
    const c = this.contact();
    if (!c || !name.trim()) return;
    await this.contactService.update(c.id, { name: name.trim() });
    this.contact.set({ ...c, name: name.trim() });
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

  async makeCourier(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courier.bonusPrompt'),
      inputs: [{ name: 'pct', type: 'number', value: '5', placeholder: '5' }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: this.translate.instant('confirm'),
          handler: async (data: { pct: string }) => {
            const pct = parseFloat(data.pct) || 5;
            const link = await this.courierService.create(this.contact()!.user, pct);
            this.courierLink.set(link);
          },
        },
      ],
    });
    await alert.present();
  }

  async removeCourier(): Promise<void> {
    const link = this.courierLink();
    if (!link) return;
    await this.courierService.remove(link.id);
    this.courierLink.set(null);
  }

  showLinkQr(): void {
    const c = this.contact();
    if (!c) return;
    this.qrPayload.set(this.deviceService.generateQrPayload(c.id, c.name));
    this.showQrModal.set(true);
  }

  async onQrScanned(data: string): Promise<void> {
    this.showScanModal.set(false);
    try {
      const parsed = JSON.parse(data);
      const { deviceId, publicKey, contactId, contactName } = parsed;
      const c = this.contact();
      if (!c) return;
      const pair = await this.deviceService.createPair(c.id, deviceId, publicKey, contactName);
      this.pair.set(pair);
      await this.contactService.update(c.id, { user: deviceId, linkedName: contactName });
      this.contact.set({ ...c, user: deviceId, linkedName: contactName });
      await this.encryptedSync.notifyChange('contacts', c.id, 'upsert', { ...c, user: deviceId, linkedName: contactName });
      this.toast.success('Verlinkt mit ' + contactName);
    } catch (e) {
      this.toast.error('QR-Code ungültig');
    }
  }

  async unlinkContact(): Promise<void> {
    const p = this.pair();
    const c = this.contact();
    if (!p || !c) return;
    await this.deviceService.removePair(p.id);
    await this.contactService.update(c.id, { user: '', linkedName: '' });
    this.contact.set({ ...c, user: '', linkedName: '' });
    this.pair.set(null);
    this.toast.success('Verlinkung aufgehoben');
  }

  showTransactionActions(tx: Transaction): void {
    this.selectedTransaction.set(tx);
    this.showTxActions.set(true);
  }

  private async confirmDeleteTransaction(): Promise<void> {
    const tx = this.selectedTransaction();
    if (!tx) return;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('transaction.delete'),
      message: this.translate.instant('transaction.deleteConfirm'),
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: this.translate.instant('delete'),
          role: 'destructive',
          handler: () => {
            this.deleteTransaction(tx);
          },
        },
      ],
    });
    await alert.present();
  }

  private async deleteTransaction(tx: Transaction): Promise<void> {
    const c = this.contact();
    if (!c) return;
    await this.txService.remove(tx.id);

    // Reload transactions
    const txs = await this.txService.loadByContact(c.id, 200);
    this.allTransactions.set(txs);

    // Reload contact to get updated balance
    const updated = await this.contactService.getById(c.id);
    if (updated) this.contact.set(updated);
  }
}
