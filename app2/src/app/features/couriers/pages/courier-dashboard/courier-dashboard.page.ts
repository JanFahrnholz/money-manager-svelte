import { Component, inject, OnInit, signal } from '@angular/core';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { RouterLink } from '@angular/router';
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
  IonAvatar,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowForward } from 'ionicons/icons';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { DeviceService } from '../../../../core/services/device.service';
import type { Pair } from '../../../../core/models/pair.model';

interface RemoteContact {
  id: string;
  pairId: string;
  name: string;
  balance: number;
  score: number;
}

@Component({
  selector: 'app-courier-dashboard',
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
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonButton,
    IonIcon,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" [text]="'back' | translate" />
        </ion-buttons>
        <ion-title>{{ 'courier.dashboard' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (courierPair(); as pair) {
        <!-- Manager info card -->
        <div class="manager-header">
          <ion-avatar class="avatar-lg">
            <div class="avatar-inner">{{ pair.label.charAt(0).toUpperCase() }}</div>
          </ion-avatar>
          <p class="manager-label">{{ 'courier.manager' | translate }}</p>
          <h2 class="manager-name">{{ pair.label }}</h2>
        </div>

        <!-- Manager's contacts from remote cache -->
        @if (managerContacts().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.managerContacts' | translate }}</h3>
            <ion-list [inset]="true">
              @for (c of managerContacts(); track c.id) {
                <ion-item>
                  <ion-avatar slot="start" style="width:32px;height:32px;">
                    <div class="contact-avatar">{{ c.name.charAt(0).toUpperCase() }}</div>
                  </ion-avatar>
                  <ion-label>
                    <h3>{{ c.name }}</h3>
                    <p [style.color]="c.balance < 0 ? '#ff3b30' : c.balance > 0 ? '#4cd964' : '#888'">
                      {{ c.balance | euro }}
                    </p>
                  </ion-label>
                  <ion-button
                    slot="end"
                    size="small"
                    fill="outline"
                    [routerLink]="['/tabs/transactions/create']"
                    [queryParams]="{ remoteContactId: c.id, remoteContactName: c.name, pairId: pair.id }"
                  >
                    {{ 'courier.sellTo' | translate }}
                    <ion-icon name="arrow-forward" slot="end" />
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          </div>
        } @else {
          <div class="empty-contacts">
            <p>{{ 'courier.noContactsSynced' | translate }}</p>
            <p class="hint">{{ 'courier.waitingForSync' | translate }}</p>
          </div>
        }
      } @else {
        <!-- No courier pair found -->
        <div class="empty-state">
          <div class="empty-icon">&#x1f4e6;</div>
          <p>{{ 'courier.noPairFound' | translate }}</p>
          <p class="hint">{{ 'courier.scanQrHint' | translate }}</p>
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .manager-header {
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
      .manager-label {
        margin: 0;
        font-size: 12px;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .manager-name {
        margin: 4px 0 0;
        font-size: 20px;
        font-weight: 600;
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
      .contact-avatar {
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
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--ion-color-medium);
      }
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      .empty-contacts {
        text-align: center;
        padding: 24px;
        color: var(--ion-color-medium);
      }
      .hint {
        font-size: 12px;
        margin-top: 4px;
      }
    `,
  ],
})
export class CourierDashboardPage implements OnInit {
  private readonly sqlite = inject(SqliteService);
  private readonly deviceService = inject(DeviceService);

  readonly courierPair = signal<Pair | null>(null);
  readonly managerContacts = signal<RemoteContact[]>([]);

  constructor() {
    addIcons({ arrowForward });
  }

  async ngOnInit(): Promise<void> {
    // Find first pair with role 'courier'
    const pairs = this.deviceService.pairs();
    const courierPair = pairs.find(p => p.role === 'courier');
    if (!courierPair) return;

    this.courierPair.set(courierPair);

    // Load manager's contacts from the remote_contacts cache
    const contacts = await this.sqlite.query<RemoteContact>(
      'SELECT * FROM remote_contacts WHERE pairId = ? ORDER BY name ASC',
      [courierPair.id],
    );
    this.managerContacts.set(contacts);
  }
}
