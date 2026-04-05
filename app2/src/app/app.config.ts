import { ApplicationConfig, provideZonelessChangeDetection, importProvidersFrom, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { SqliteService } from './core/services/sqlite.service';
import { UserService } from './core/services/user.service';
import { DeviceService } from './core/services/device.service';

function initializeApp() {
  const sqlite = inject(SqliteService);
  const user = inject(UserService);
  const device = inject(DeviceService);
  const translate = inject(TranslateService);

  return async () => {
    const lang = localStorage.getItem('language') || 'de';
    translate.setDefaultLang('de');
    translate.use(lang);

    await sqlite.init();
    await user.init();
    await device.init();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideIonicAngular({ mode: 'ios' }),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'de',
      })
    ),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json',
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      multi: true,
    },
  ],
};
