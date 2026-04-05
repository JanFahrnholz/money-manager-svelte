import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { language, syncCircle, peopleCircle, briefcase, cloudDownload } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../../core/services/user.service';
import { RelayService } from '../../../../core/services/relay.service';
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ContactService } from '../../../contacts/services/contact.service';
import { CourierService } from '../../../couriers/services/courier.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonIcon,
    IonButton,
    RouterLink,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tabs.profile' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- User info section -->
      <div class="user-info">
        <div class="avatar">{{ initial() }}</div>
        <div class="username">{{ userService.user()?.username }}</div>
      </div>

      <!-- Settings list -->
      <ion-list [inset]="true">
        <ion-item>
          <ion-icon name="language" slot="start" />
          <ion-select
            [label]="'profile.language' | translate"
            [value]="translate.currentLang"
            (ionChange)="changeLang($event)"
          >
            <ion-select-option value="de">Deutsch</ion-select-option>
            <ion-select-option value="en">English</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-icon name="sync-circle" slot="start" />
          <ion-label>{{ 'profile.sync' | translate }}</ion-label>
          <ion-note slot="end" [color]="relay.online() ? 'success' : 'medium'">
            {{ relay.online() ? ('online' | translate) : ('offline' | translate) }}
          </ion-note>
        </ion-item>
        <ion-item [routerLink]="['/tabs/profile/network']" detail>
          <ion-icon name="people-circle" slot="start" />
          <ion-label>{{ 'profile.network' | translate }}</ion-label>
        </ion-item>
        @if (isCourier()) {
          <ion-item [routerLink]="['/tabs/profile/courier-dashboard']" detail>
            <ion-icon name="briefcase" slot="start" />
            <ion-label>{{ 'courier.dashboard' | translate }}</ion-label>
          </ion-item>
        }
      </ion-list>

      <!-- Import -->
      @if (!imported()) {
        <div style="padding:16px;">
          <ion-button expand="block" color="warning" (click)="importData()">
            <ion-icon name="cloud-download" slot="start" />
            Daten importieren (PB Backup)
          </ion-button>
        </div>
      }

      <!-- Device Info -->
      <ion-list [inset]="true">
        <ion-item>
          <ion-label>{{ 'profile.deviceId' | translate }}</ion-label>
          <ion-note slot="end">{{ deviceService.deviceId().slice(0, 8) }}...</ion-note>
        </ion-item>
      </ion-list>

      <!-- Active Pairs -->
      <div style="padding:0 16px;">
        <div style="font-size:12px;font-weight:600;color:#666;margin-bottom:8px;">{{ 'profile.pairs' | translate }}</div>
      </div>
      @if (deviceService.pairs().length === 0) {
        <ion-list [inset]="true">
          <ion-item><ion-label color="medium">{{ 'profile.noPairs' | translate }}</ion-label></ion-item>
        </ion-list>
      } @else {
        <ion-list [inset]="true">
          @for (pair of deviceService.pairs(); track pair.id) {
            <ion-item>
              <ion-label>
                <h3>{{ pair.label || 'Unknown' }}</h3>
                <p>{{ getContactName(pair.localContactId) }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" color="danger" (click)="unlinkPair(pair.id)">
                {{ 'contact.unlink' | translate }}
              </ion-button>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    `
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 0;
      }
      .avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--ion-color-warning, gold);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
        text-transform: uppercase;
      }
      .username {
        margin-top: 8px;
        font-size: 20px;
        font-weight: bold;
      }
    `,
  ],
})
export class ProfilePage implements OnInit {
  readonly userService = inject(UserService);
  readonly relay = inject(RelayService);
  readonly translate = inject(TranslateService);
  readonly deviceService = inject(DeviceService);
  private readonly contactService = inject(ContactService);
  private readonly courierService = inject(CourierService);
  private readonly sqlite = inject(SqliteService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);

  readonly initial = computed(() => {
    const name = this.userService.user()?.username;
    return name ? name.charAt(0) : '?';
  });

  readonly isCourier = signal(false);
  readonly imported = signal(false);

  constructor() {
    addIcons({ language, syncCircle, peopleCircle, briefcase, cloudDownload });
  }

  async ngOnInit(): Promise<void> {
    await this.contactService.loadAll();
    this.imported.set(this.contactService.contacts().length > 0);
    await this.courierService.loadManagedBy();
    this.isCourier.set(this.courierService.managedBy().length > 0);
  }

  changeLang(event: CustomEvent): void {
    const lang = event.detail.value;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }

  getContactName(contactId: string): string {
    const contact = this.contactService.contacts().find(c => c.id === contactId);
    return contact?.name ?? contactId;
  }

  async unlinkPair(pairId: string): Promise<void> {
    await this.deviceService.removePair(pairId);
  }

  async importData(): Promise<void> {
    try {
      const data: any = await this.http.get('./assets/migration-data.json').toPromise();
      const userId = this.userService.user()?.id;
      if (!userId || !data) return;

      let contactCount = 0;
      let txCount = 0;

      for (const c of data.contacts) {
        await this.sqlite.upsert('contacts', { ...c, owner: userId, synced: 0 });
        contactCount++;
      }

      for (const t of data.transactions) {
        await this.sqlite.upsert('transactions', { ...t, owner: userId, synced: 0 });
        txCount++;
      }

      await this.userService.setBalance(data.userBalance);
      await this.contactService.loadAll();

      this.imported.set(true);
      this.toast.success(`Importiert: ${contactCount} Kontakte, ${txCount} Transaktionen`);
    } catch (e: any) {
      this.toast.error('Import fehlgeschlagen: ' + e.message);
    }
  }
}
