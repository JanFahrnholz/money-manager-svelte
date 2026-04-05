import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { EncryptedSyncService } from './core/services/encrypted-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  constructor(private sync: EncryptedSyncService) {}

  async ngOnInit() {
    // SQLite, User, Device already initialized via APP_INITIALIZER
    await this.sync.pollAll();
    this.sync.startPolling();
  }
}
