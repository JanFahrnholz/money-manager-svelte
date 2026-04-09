import { Component, computed, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
  IonBadge,
  AlertController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { checkmarkCircle, trashOutline } from 'ionicons/icons';
import { TransactionService } from '../../services/transaction.service';
import { ContactService } from '../../../contacts/services/contact.service';
import { TransactionType } from '../../../../core/models/transaction.model';
import type { Transaction } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-planned-list',
  standalone: true,
  imports: [
    DatePipe,
    EuroPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
    IonBadge,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/dashboard" [text]="'back' | translate" />
        </ion-buttons>
        <ion-title>{{ 'planned.title' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (planned().length === 0) {
        <div class="empty-state">
          <p>{{ 'planned.empty' | translate }}</p>
        </div>
      } @else {
        <ion-list>
          @for (tx of planned(); track tx.id) {
            <ion-item>
              <ion-label>
                <h3>{{ 'transaction.' + txTypeKey(tx.type) | translate }}</h3>
                <p>{{ contactNames()[tx.contact] || '—' }}</p>
                <p [style.color]="isOverdue(tx.date) ? '#ff3b30' : ''">
                  {{ tx.date | date:'dd.MM.yyyy' }}
                  @if (isOverdue(tx.date)) {
                    <ion-badge color="danger" style="margin-left:8px;">Überfällig</ion-badge>
                  }
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
                (click)="confirmTx(tx.id)"
              >
                <ion-icon slot="icon-only" name="checkmark-circle" />
              </ion-button>
              <ion-button
                slot="end"
                fill="clear"
                size="small"
                color="danger"
                (click)="deleteTx(tx.id)"
              >
                <ion-icon slot="icon-only" name="trash-outline" />
              </ion-button>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: `
    .empty-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 50%;
      color: var(--ion-color-medium);
      font-size: 16px;
    }
  `,
})
export class PlannedListPage implements OnInit {
  readonly planned = signal<Transaction[]>([]);

  readonly contactNames = computed(() => {
    const map: Record<string, string> = {};
    for (const c of this.contactService.contacts()) {
      map[c.id] = c.name;
    }
    return map;
  });

  constructor(
    private txService: TransactionService,
    private contactService: ContactService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
  ) {
    addIcons({ checkmarkCircle, trashOutline });
  }

  ngOnInit(): void {
    this.contactService.loadAll();
    this.txService.loadPlanned().then((txs) => this.planned.set(txs));
  }

  async confirmTx(id: string): Promise<void> {
    await this.txService.confirmPlanned(id);
    this.planned.update((list) => list.filter((t) => t.id !== id));
  }

  async deleteTx(id: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('transaction.delete'),
      message: this.translate.instant('transaction.deleteConfirm'),
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: this.translate.instant('delete'),
          role: 'destructive',
          handler: async () => {
            await this.txService.remove(id);
            this.planned.update((list) => list.filter((t) => t.id !== id));
          },
        },
      ],
    });
    await alert.present();
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  txTypeKey(type: TransactionType): string {
    switch (type) {
      case TransactionType.Income:
        return 'income';
      case TransactionType.Expense:
        return 'expense';
      case TransactionType.Credit:
        return 'credit';
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
}
