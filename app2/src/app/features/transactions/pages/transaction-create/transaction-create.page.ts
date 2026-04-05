import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonInput,
  IonToggle,
  IonText,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { NumpadComponent } from '../../../../shared/components/numpad/numpad.component';
import { TransactionService } from '../../services/transaction.service';
import { ContactService } from '../../../contacts/services/contact.service';
import { CourierService } from '../../../couriers/services/courier.service';
import { UserService } from '../../../../core/services/user.service';
import { TransactionType } from '../../../../core/models/transaction.model';
import type { CourierLink } from '../../../../core/models/courier-link.model';

@Component({
  selector: 'app-transaction-create',
  standalone: true,
  imports: [
    DecimalPipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonInput,
    IonToggle,
    IonText,
    TranslateModule,
    NumpadComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">{{ 'cancel' | translate }}</ion-button>
        </ion-buttons>
        <ion-title>{{ 'transaction.create' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="save()" color="primary" [strong]="true">
            {{ 'save' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="amount-display">
        <ion-text color="dark">
          <h1 class="amount-value">{{ amount() | number: '1.2-2' }}</h1>
        </ion-text>
        <ion-text color="medium">
          <p class="contact-name">{{ contactName() }}</p>
        </ion-text>
      </div>

      <ion-segment [value]="type()" (ionChange)="onTypeChange($event)">
        <ion-segment-button [value]="TransactionType.Income">
          <ion-label>{{ 'transaction.income' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button [value]="TransactionType.Expense">
          <ion-label>{{ 'transaction.expense' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button [value]="TransactionType.Invoice">
          <ion-label>{{ 'transaction.invoice' | translate }}</ion-label>
        </ion-segment-button>
        <ion-segment-button [value]="TransactionType.Refund">
          <ion-label>{{ 'transaction.refund' | translate }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      @if (courierLink()) {
        <ion-segment [value]="type()" (ionChange)="onTypeChange($event)" style="margin-top: 8px;">
          <ion-segment-button [value]="TransactionType.Restock">
            <ion-label>{{ 'transaction.restock' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button [value]="TransactionType.Collect">
            <ion-label>{{ 'transaction.collect' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button [value]="TransactionType.Redeem">
            <ion-label>{{ 'transaction.redeem' | translate }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      }

      <ion-list>
        <ion-item>
          <ion-input
            [label]="'transaction.info' | translate"
            labelPlacement="stacked"
            [(ngModel)]="info"
          />
        </ion-item>
        <ion-item>
          <ion-toggle [(ngModel)]="planned">{{ 'transaction.planned' | translate }}</ion-toggle>
        </ion-item>
      </ion-list>

      <app-numpad (valueChange)="amount.set($event)" />
    </ion-content>
  `,
  styles: `
    .amount-display {
      text-align: center;
      padding: 16px 0;
    }
    .amount-value {
      font-size: 48px;
      margin: 0;
    }
    .contact-name {
      font-size: 14px;
      margin: 4px 0 0;
    }
  `,
})
export class TransactionCreatePage implements OnInit {
  readonly TransactionType = TransactionType;

  readonly amount = signal(0);
  readonly type = signal(TransactionType.Income);
  readonly contactName = signal('');
  readonly courierLink = signal<CourierLink | null>(null);

  info = '';
  planned = false;

  private contactId = '';

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private txService: TransactionService,
    private contactService: ContactService,
    private courierService: CourierService,
    private auth: UserService,
  ) {}

  ngOnInit(): void {
    this.contactId = this.route.snapshot.queryParamMap.get('contactId') ?? '';
    if (this.contactId) {
      this.contactService.getById(this.contactId).then(async (c) => {
        if (c) {
          this.contactName.set(c.name);
          if (c.user) {
            const links = await this.courierService.getByManager(this.auth.user()?.id ?? '');
            const link = links.find((l) => l.courier === c.user);
            this.courierLink.set(link ?? null);
          }
        }
      });
    }
  }

  onTypeChange(event: CustomEvent): void {
    this.type.set(event.detail.value as TransactionType);
  }

  async save(): Promise<void> {
    if (this.amount() <= 0 || !this.contactId) return;

    await this.txService.create({
      amount: this.amount(),
      type: this.type(),
      contact: this.contactId,
      info: this.info,
      planned: this.planned,
      courierLink: this.courierLink()?.id,
    });

    this.navCtrl.back();
  }

  dismiss(): void {
    this.navCtrl.back();
  }
}
