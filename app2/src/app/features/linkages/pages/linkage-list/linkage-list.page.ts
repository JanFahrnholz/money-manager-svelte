import { Component, inject } from '@angular/core';
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
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { linkOutline } from 'ionicons/icons';
import { DeviceService } from '../../../../core/services/device.service';

@Component({
  selector: 'app-linkage-list',
  standalone: true,
  imports: [
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
    IonIcon,
    RouterLink,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" [text]="'back' | translate" />
        </ion-buttons>
        <ion-title>{{ 'profile.pairs' | translate }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      @if (pairs().length === 0) {
        <div style="text-align:center;padding:60px 24px;">
          <ion-icon name="link-outline" style="font-size:64px;color:#666;display:block;margin:0 auto 16px;" />
          <h3 style="color:#fff;">{{ 'profile.noPairs' | translate }}</h3>
          <p style="color:#888;">Scanne einen QR-Code um dich zu verlinken.</p>
        </div>
      } @else {
        <ion-list>
          @for (pair of pairs(); track pair.id) {
            <ion-item [routerLink]="['/tabs/profile/linkages', pair.id]" detail>
              <ion-avatar slot="start">
                <div style="width:100%;height:100%;border-radius:50%;background:#5856d6;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;">
                  {{ pair.label.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              <ion-label>
                <h2>{{ pair.label || 'Unbekannt' }}</h2>
                <p>{{ pair.role === 'courier' ? 'Kurier' : 'Viewer' }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
})
export class LinkageListPage {
  private readonly deviceService = inject(DeviceService);
  readonly pairs = this.deviceService.pairs;

  constructor() {
    addIcons({ linkOutline });
  }
}
