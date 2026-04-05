import { Component, computed, inject } from '@angular/core';
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
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { logOut, language, syncCircle, peopleCircle } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { PocketbaseService } from '../../../../core/services/pocketbase.service';

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
    IonButton,
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
        <div class="username">{{ auth.user()?.username }}</div>
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
          <ion-note slot="end" [color]="pb.online() ? 'success' : 'danger'">
            {{ (pb.online() ? 'online' : 'offline') | translate }}
          </ion-note>
        </ion-item>
        <ion-item [routerLink]="['/tabs/profile/network']" detail>
          <ion-icon name="people-circle" slot="start" />
          <ion-label>{{ 'profile.network' | translate }}</ion-label>
        </ion-item>
      </ion-list>

      <!-- Logout button -->
      <ion-button expand="block" color="danger" fill="outline" (click)="auth.logout()">
        <ion-icon name="log-out" slot="start" />
        {{ 'profile.logout' | translate }}
      </ion-button>
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
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly pb = inject(PocketbaseService);
  readonly translate = inject(TranslateService);

  readonly initial = computed(() => {
    const name = this.auth.user()?.username;
    return name ? name.charAt(0) : '?';
  });

  constructor() {
    addIcons({ logOut, language, syncCircle, peopleCircle });
  }

  changeLang(event: CustomEvent): void {
    const lang = event.detail.value;
    this.translate.use(lang);
    localStorage.setItem('language', lang);
  }
}
