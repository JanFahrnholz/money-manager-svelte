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
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { language, syncCircle, peopleCircle, briefcase } from 'ionicons/icons';
import { UserService } from '../../../../core/services/user.service';
import { RelayService } from '../../../../core/services/relay.service';
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
  private readonly courierService = inject(CourierService);

  readonly initial = computed(() => {
    const name = this.userService.user()?.username;
    return name ? name.charAt(0) : '?';
  });

  readonly isCourier = signal(false);

  constructor() {
    addIcons({ language, syncCircle, peopleCircle, briefcase });
  }

  async ngOnInit(): Promise<void> {
    await this.courierService.loadManagedBy();
    this.isCourier.set(this.courierService.managedBy().length > 0);
  }

  changeLang(event: CustomEvent): void {
    const lang = event.detail.value;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }
}
