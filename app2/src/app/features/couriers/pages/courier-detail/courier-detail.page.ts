import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonProgressBar,
  AlertController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';
import { CourierService } from '../../services/courier.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import type { CourierLink } from '../../../../core/models/courier-link.model';
import type { Contact } from '../../../../core/models/contact.model';
import type { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-courier-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonProgressBar,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile/network" />
        </ion-buttons>
        <ion-title>{{ courierName() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" name="settings-outline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (link(); as l) {
        <!-- Courier header -->
        <div class="courier-header">
          <ion-avatar class="avatar-lg">
            <div class="avatar-inner">{{ courierName().charAt(0).toUpperCase() }}</div>
          </ion-avatar>
          <h2 class="courier-name">{{ courierName() }}</h2>
          <p class="courier-since">{{ 'courier.since' | translate }} {{ l.created | date:'mediumDate' }}</p>
        </div>

        <!-- Balance cards -->
        <ion-grid>
          <ion-row>
            <ion-col size="4">
              <ion-card class="balance-card">
                <ion-card-content class="balance-card-content" style="border-top: 3px solid #ffd600;">
                  <div class="balance-value">{{ l.inventoryBalance | number:'1.2-2' }}&euro;</div>
                  <div class="balance-label">{{ 'courier.inventory' | translate }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="4">
              <ion-card class="balance-card">
                <ion-card-content class="balance-card-content" style="border-top: 3px solid #4cd964;">
                  <div class="balance-value">{{ l.salesBalance | number:'1.2-2' }}&euro;</div>
                  <div class="balance-label">{{ 'courier.sales' | translate }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="4">
              <ion-card class="balance-card">
                <ion-card-content class="balance-card-content" style="border-top: 3px solid #ff9500;">
                  <div class="balance-value">{{ l.bonusBalance | number:'1.2-2' }}&euro;</div>
                  <div class="balance-label">{{ 'courier.bonus' | translate }}</div>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-label">{{ 'courier.progress' | translate }}: {{ progress() | number:'1.0-0' }}%</div>
          <ion-progress-bar [value]="progress() / 100" color="success" />
        </div>

        <!-- Action buttons -->
        <ion-grid>
          <ion-row>
            <ion-col size="4">
              <ion-button
                expand="block"
                class="action-btn"
                style="--background: #ffd600; --color: #000;"
                (click)="onRestockClick()"
              >
                {{ 'courier.restock' | translate }}
              </ion-button>
            </ion-col>
            <ion-col size="4">
              <ion-button
                expand="block"
                class="action-btn"
                style="--background: #4cd964; --color: #fff;"
                (click)="onCollectClick()"
              >
                {{ 'courier.collect' | translate }}
              </ion-button>
            </ion-col>
            <ion-col size="4">
              <ion-button
                expand="block"
                class="action-btn"
                style="--background: #ff9500; --color: #fff;"
                (click)="onRedeemClick()"
              >
                {{ 'courier.redeem' | translate }}
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Settings list -->
        <div class="section">
          <h3 class="section-title">{{ 'profile.settings' | translate }}</h3>
          <ion-list [inset]="true">
            <ion-item button (click)="editBonusPercentage()">
              <ion-label>{{ 'courier.bonusPercent' | translate }}</ion-label>
              <ion-note slot="end">{{ l.bonusPercentage }}%</ion-note>
            </ion-item>
            <ion-item>
              <ion-label>{{ 'courier.totalSales' | translate }}</ion-label>
              <ion-note slot="end">{{ l.totalSales | number:'1.2-2' }}&euro;</ion-note>
            </ion-item>
          </ion-list>
        </div>

        <!-- Sub-couriers list -->
        @if (subCouriers().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.subCouriers' | translate }}</h3>
            <ion-list [inset]="true">
              @for (sub of subCouriers(); track sub.id) {
                <ion-item [routerLink]="['/tabs/profile/network', sub.id]" detail>
                  <ion-avatar slot="start" style="width:32px;height:32px;">
                    <div class="sub-avatar">{{ getSubCourierInitial(sub.id) }}</div>
                  </ion-avatar>
                  <ion-label>{{ getSubCourierName(sub.id) }}</ion-label>
                </ion-item>
              }
            </ion-list>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .courier-header {
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
        background: var(--ion-color-primary);
        color: #fff;
        font-weight: 600;
        font-size: 1.6rem;
      }
      .courier-name {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
      .courier-since {
        margin: 4px 0 0;
        font-size: 13px;
        color: var(--ion-color-medium);
      }
      .balance-card {
        margin: 0;
      }
      .balance-card-content {
        text-align: center;
        padding: 8px 4px;
      }
      .balance-value {
        font-size: 16px;
        font-weight: bold;
      }
      .balance-label {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }
      .progress-section {
        margin: 16px 0;
      }
      .progress-label {
        font-size: 13px;
        color: var(--ion-color-medium);
        margin-bottom: 6px;
      }
      .action-btn {
        font-size: 12px;
        --border-radius: 8px;
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
      .sub-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--ion-color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }
    `,
  ],
})
export class CourierDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);
  private readonly translate = inject(TranslateService);
  private readonly courierService = inject(CourierService);
  private readonly sqlite = inject(SqliteService);

  readonly link = signal<CourierLink | null>(null);
  readonly courierName = signal<string>('');
  readonly subCouriers = signal<CourierLink[]>([]);
  readonly subCourierNames = signal<Record<string, string>>({});

  readonly progress = computed(() => {
    const l = this.link();
    if (!l) return 0;
    const total = l.inventoryBalance + l.salesBalance;
    if (total === 0) return 0;
    const value = (l.salesBalance / total) * 100;
    return isFinite(value) ? value : 0;
  });

  constructor() {
    addIcons({ settingsOutline });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) return;
    await this.loadData(id);
  }

  private async loadData(id: string): Promise<void> {
    const linkData = await this.courierService.getById(id);
    if (!linkData) return;
    this.link.set(linkData);

    // Resolve courier name
    const name = await this.resolveCourierName(linkData.courier);
    this.courierName.set(name);

    // Load sub-couriers managed by this courier
    const subs = await this.courierService.getByManager(linkData.courier);
    this.subCouriers.set(subs);

    // Resolve sub-courier names
    const names: Record<string, string> = {};
    for (const sub of subs) {
      names[sub.id] = await this.resolveCourierName(sub.courier);
    }
    this.subCourierNames.set(names);
  }

  private async reload(): Promise<void> {
    const l = this.link();
    if (!l) return;
    await this.loadData(l.id);
  }

  private async resolveCourierName(courierId: string): Promise<string> {
    const contacts = await this.sqlite.query<Contact>(
      'SELECT * FROM contacts WHERE user = ? LIMIT 1',
      [courierId],
    );
    if (contacts.length > 0) {
      return contacts[0].name;
    }

    const users = await this.sqlite.query<User>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [courierId],
    );
    if (users.length > 0) {
      return users[0].username;
    }

    return 'Unknown';
  }

  async promptAmount(header: string, action: (amount: number) => Promise<void>): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      inputs: [{ name: 'amount', type: 'number', placeholder: '0' }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: 'OK',
          handler: async (data: { amount: string }) => {
            const amount = parseFloat(data.amount);
            if (!amount || amount <= 0) return;
            await action(amount);
            await this.reload();
          },
        },
      ],
    });
    await alert.present();
  }

  onRestockClick(): void {
    this.promptAmount(this.translate.instant('courier.restock'), (amount) => this.onRestock(amount));
  }

  onCollectClick(): void {
    this.promptAmount(this.translate.instant('courier.collect'), (amount) => this.onCollect(amount));
  }

  onRedeemClick(): void {
    this.promptAmount(this.translate.instant('courier.redeem'), (amount) => this.onRedeem(amount));
  }

  getSubCourierName(id: string): string {
    return this.subCourierNames()[id] || 'Unknown';
  }

  getSubCourierInitial(id: string): string {
    const name = this.getSubCourierName(id);
    return name.charAt(0).toUpperCase();
  }

  async onRestock(amount: number): Promise<void> {
    const l = this.link();
    if (!l) return;
    await this.courierService.restock(l.id, amount);
  }

  async onCollect(amount: number): Promise<void> {
    const l = this.link();
    if (!l) return;
    await this.courierService.collect(l.id, amount);
  }

  async onRedeem(amount: number): Promise<void> {
    const l = this.link();
    if (!l) return;
    await this.courierService.redeemBonus(l.id, amount);
  }

  async editBonusPercentage(): Promise<void> {
    const l = this.link();
    if (!l) return;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('courier.bonusPercent'),
      inputs: [{ name: 'pct', type: 'number', value: String(l.bonusPercentage), placeholder: '5' }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' },
        {
          text: this.translate.instant('save'),
          handler: async (data: { pct: string }) => {
            const pct = parseFloat(data.pct);
            if (isNaN(pct) || pct < 0) return;
            await this.courierService.updateBonusPercentage(l.id, pct);
            await this.reload();
          },
        },
      ],
    });
    await alert.present();
  }
}
