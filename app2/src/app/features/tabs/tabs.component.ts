import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChart, people, person } from 'ionicons/icons';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, TranslateModule],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard">
          <ion-icon name="stats-chart" />
          <ion-label>{{ 'tabs.dashboard' | translate }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="contacts">
          <ion-icon name="people" />
          <ion-label>{{ 'tabs.contacts' | translate }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="profile">
          <ion-icon name="person" />
          <ion-label>{{ 'tabs.profile' | translate }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsComponent {
  constructor() {
    addIcons({ statsChart, people, person });
  }
}
