import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './core/services/sqlite.service';
import { UserService } from './core/services/user.service';
import { DeviceService } from './core/services/device.service';
import { EncryptedSyncService } from './core/services/encrypted-sync.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  constructor(
    private sqlite: SqliteService,
    private user: UserService,
    private device: DeviceService,
    private sync: EncryptedSyncService,
    private translate: TranslateService,
  ) {
    const lang = localStorage.getItem('language') || 'de';
    this.translate.setDefaultLang('de');
    this.translate.use(lang);
  }

  async ngOnInit() {
    await this.sqlite.init();
    await this.user.init();
    await this.device.init();
    await this.sync.pollAll();
    this.sync.startPolling();
  }
}
