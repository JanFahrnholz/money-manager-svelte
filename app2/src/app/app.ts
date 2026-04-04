import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './core/services/sqlite.service';
import { AuthService } from './core/services/auth.service';
import { SyncService } from './core/services/sync.service';
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
    private auth: AuthService,
    private sync: SyncService,
    private translate: TranslateService,
  ) {
    const lang = localStorage.getItem('language') || 'de';
    this.translate.setDefaultLang('de');
    this.translate.use(lang);
  }

  async ngOnInit() {
    await this.sqlite.init();
    await this.auth.init();
    await this.sync.syncAll();
    this.sync.startPeriodicSync();
  }
}
