import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Kontakte</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      Contacts works!
    </ion-content>
  `,
})
export class ContactListPage {}
