import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowForward } from 'ionicons/icons';
import { CourierService } from '../../services/courier.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { UserService } from '../../../../core/services/user.service';
import type { CourierLink } from '../../../../core/models/courier-link.model';
import type { Contact } from '../../../../core/models/contact.model';
import type { User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-courier-dashboard',
  standalone: true,
  imports: [
    DecimalPipe,
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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonProgressBar,
    IonButton,
    IonIcon,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" />
        </ion-buttons>
        <ion-title>{{ 'courier.dashboard' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (link(); as l) {
        <!-- Manager info card -->
        <div class="manager-header">
          <ion-avatar class="avatar-lg">
            <div class="avatar-inner">{{ managerName().charAt(0).toUpperCase() }}</div>
          </ion-avatar>
          <p class="manager-label">{{ 'courier.manager' | translate }}</p>
          <h2 class="manager-name">{{ managerName() }}</h2>
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

        <!-- Manager's contacts -->
        @if (managerContacts().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.managerContacts' | translate }}</h3>
            <ion-list [inset]="true">
              @for (c of managerContacts(); track c.id) {
                <ion-item>
                  <ion-avatar slot="start" style="width:32px;height:32px;">
                    <div class="contact-avatar">{{ c.name.charAt(0).toUpperCase() }}</div>
                  </ion-avatar>
                  <ion-label>{{ c.name }}</ion-label>
                  <ion-button
                    slot="end"
                    size="small"
                    fill="outline"
                    [routerLink]="['/tabs/transactions/create']"
                    [queryParams]="{ contactId: c.id }"
                  >
                    {{ 'courier.sellTo' | translate }}
                    <ion-icon name="arrow-forward" slot="end" />
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          </div>
        }

        <!-- Own contacts -->
        @if (ownContacts().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.ownContacts' | translate }}</h3>
            <ion-list [inset]="true">
              @for (c of ownContacts(); track c.id) {
                <ion-item>
                  <ion-avatar slot="start" style="width:32px;height:32px;">
                    <div class="contact-avatar">{{ c.name.charAt(0).toUpperCase() }}</div>
                  </ion-avatar>
                  <ion-label>{{ c.name }}</ion-label>
                  <ion-button
                    slot="end"
                    size="small"
                    fill="outline"
                    [routerLink]="['/tabs/transactions/create']"
                    [queryParams]="{ contactId: c.id }"
                  >
                    {{ 'courier.sellTo' | translate }}
                    <ion-icon name="arrow-forward" slot="end" />
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          </div>
        }

        <!-- Sub-couriers -->
        @if (subCouriers().length > 0) {
          <div class="section">
            <h3 class="section-title">{{ 'courier.mySubCouriers' | translate }}</h3>
            <ion-list [inset]="true">
              @for (sub of subCouriers(); track sub.id) {
                <ion-item [routerLink]="['/tabs/profile/network', sub.id]" detail>
                  <ion-avatar slot="start" style="width:32px;height:32px;">
                    <div class="contact-avatar">{{ getSubCourierInitial(sub.id) }}</div>
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
    `,
  ],
})
export class CourierDashboardPage implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly sqlite = inject(SqliteService);
  private readonly auth = inject(UserService);

  readonly link = signal<CourierLink | null>(null);
  readonly managerName = signal<string>('');
  readonly managerContacts = signal<Contact[]>([]);
  readonly ownContacts = signal<Contact[]>([]);
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
    addIcons({ arrowForward });
  }

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    // Load courier_links where current user is the courier
    await this.courierService.loadManagedBy();
    const links = this.courierService.managedBy();
    if (links.length === 0) return;

    // Use the first link (could support switching later)
    const activeLink = links[0];
    this.link.set(activeLink);

    // Resolve manager name
    const name = await this.resolveManagerName(activeLink.manager);
    this.managerName.set(name);

    // Load manager's contacts
    const mContacts = await this.sqlite.query<Contact>(
      'SELECT * FROM contacts WHERE owner = ? ORDER BY name ASC',
      [activeLink.manager],
    );
    this.managerContacts.set(mContacts);

    // Load own contacts
    const oContacts = await this.sqlite.query<Contact>(
      'SELECT * FROM contacts WHERE owner = ? ORDER BY name ASC',
      [userId],
    );
    this.ownContacts.set(oContacts);

    // Load sub-couriers (where current user is a manager)
    const subs = await this.courierService.getByManager(userId);
    this.subCouriers.set(subs);

    // Resolve sub-courier names
    const names: Record<string, string> = {};
    for (const sub of subs) {
      names[sub.id] = await this.resolveSubCourierName(sub.courier);
    }
    this.subCourierNames.set(names);
  }

  getSubCourierName(id: string): string {
    return this.subCourierNames()[id] || 'Unknown';
  }

  getSubCourierInitial(id: string): string {
    const name = this.getSubCourierName(id);
    return name.charAt(0).toUpperCase();
  }

  private async resolveManagerName(managerId: string): Promise<string> {
    // First check if the manager has a contact where owner = manager AND user = current user
    const userId = this.auth.user()?.id;
    if (userId) {
      const contacts = await this.sqlite.query<Contact>(
        'SELECT * FROM contacts WHERE owner = ? AND user = ? LIMIT 1',
        [managerId, userId],
      );
      if (contacts.length > 0) {
        return contacts[0].linkedName || contacts[0].name;
      }
    }

    // Fall back to user table
    const users = await this.sqlite.query<User>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [managerId],
    );
    if (users.length > 0) {
      return users[0].username;
    }

    return 'Unknown';
  }

  private async resolveSubCourierName(courierId: string): Promise<string> {
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
}
