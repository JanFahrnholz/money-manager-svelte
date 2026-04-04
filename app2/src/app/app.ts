import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './core/services/sqlite.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet /></ion-app>`,
})
export class AppComponent implements OnInit {
  constructor(private sqlite: SqliteService, private auth: AuthService) {}

  async ngOnInit() {
    await this.sqlite.init();
    await this.auth.init();
  }
}
