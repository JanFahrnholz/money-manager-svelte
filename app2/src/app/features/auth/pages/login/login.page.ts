import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>MoneyManager</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1 class="ion-text-center">MoneyManager</h1>

      <ion-list>
        <ion-item>
          <ion-input
            label="{{ 'auth.username' | translate }}"
            labelPlacement="floating"
            type="text"
            [(ngModel)]="username"
          />
        </ion-item>
        <ion-item>
          <ion-input
            label="{{ 'auth.password' | translate }}"
            labelPlacement="floating"
            type="password"
            [(ngModel)]="password"
          />
        </ion-item>
      </ion-list>

      @if (error()) {
        <ion-text color="danger">
          <p class="ion-padding-start">{{ error() }}</p>
        </ion-text>
      }

      <ion-button expand="block" (click)="login()">
        {{ 'auth.login' | translate }}
      </ion-button>
      <ion-button expand="block" fill="outline" (click)="register()">
        {{ 'auth.register' | translate }}
      </ion-button>
    </ion-content>
  `,
})
export class LoginPage {
  username = '';
  password = '';
  error = signal<string>('');

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async login(): Promise<void> {
    try {
      this.error.set('');
      await this.auth.login(this.username, this.password);
      this.router.navigate(['/tabs/dashboard']);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Login failed');
    }
  }

  async register(): Promise<void> {
    try {
      this.error.set('');
      await this.auth.register(this.username, this.password);
      this.router.navigate(['/tabs/dashboard']);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Registration failed');
    }
  }
}
