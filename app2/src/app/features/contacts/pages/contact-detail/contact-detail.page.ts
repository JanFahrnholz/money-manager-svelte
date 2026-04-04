import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Kontaktdetails</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      Contact detail works!
    </ion-content>
  `,
})
export class ContactDetailPage {}
