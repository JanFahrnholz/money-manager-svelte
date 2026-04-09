import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
  IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { UserService } from '../../../../core/services/user.service';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import type { Pair } from '../../../../core/models/pair.model';

interface RemoteContact {
  id: string;
  pairId: string;
  name: string;
  balance: number;
  score: number;
}

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton, IonButtons,
    IonList, IonItem, IonLabel, IonNote, IonFab, IonFabButton, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner,
    TranslateModule, EuroPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/dashboard" />
        </ion-buttons>
        <ion-title>Agent bei {{ pair()?.label || '...' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else {
        <!-- Balance Cards -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:16px;">
          <div class="stat-card" style="border-color:rgba(255,214,0,0.3);">
            <div class="stat-label">{{ 'courier.inventory' | translate }}</div>
            <div class="stat-value" style="color:#ffd600;">{{ inventory() | euro }}</div>
          </div>
          <div class="stat-card" style="border-color:rgba(76,217,100,0.3);">
            <div class="stat-label">{{ 'courier.sales' | translate }}</div>
            <div class="stat-value" style="color:#4cd964;">{{ sales() | euro }}</div>
          </div>
          <div class="stat-card" style="border-color:rgba(255,149,0,0.3);">
            <div class="stat-label">{{ 'courier.bonus' | translate }}</div>
            <div class="stat-value" style="color:#ff9500;">{{ bonus() | euro }}</div>
          </div>
        </div>

        <!-- Manager Contacts -->
        <div style="padding:0 16px;">
          <div style="font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px;">
            {{ 'courier.managerContacts' | translate }} ({{ remoteContacts().length }})
          </div>
        </div>

        @if (remoteContacts().length === 0) {
          <div style="text-align:center;padding:32px;color:#888;">
            {{ 'courier.noContactsSynced' | translate }}
          </div>
        } @else {
          <ion-list>
            @for (rc of remoteContacts(); track rc.id) {
              <ion-item button (click)="bookIncome(rc)">
                <div slot="start" class="avatar" [style.background]="rc.balance < 0 ? 'rgba(255,59,48,0.15)' : 'rgba(76,217,100,0.15)'"
                     [style.color]="rc.balance < 0 ? '#ff3b30' : '#4cd964'">
                  {{ rc.name.charAt(0).toUpperCase() }}
                </div>
                <ion-label>
                  <h3>{{ rc.name }}</h3>
                </ion-label>
                <ion-note slot="end" [style.color]="rc.balance < 0 ? '#ff3b30' : '#4cd964'">
                  {{ rc.balance | euro }}
                </ion-note>
              </ion-item>
            }
          </ion-list>
        }
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button color="warning">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: `
    .stat-card {
      background: rgba(255,255,255,0.04);
      border: 1px solid;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
    }
    .stat-label { font-size: 11px; color: #888; }
    .stat-value { font-size: 18px; font-weight: 700; margin-top: 2px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 16px;
    }
  `,
})
export class AgentDashboardPage implements OnInit {
  readonly loading = signal(true);
  readonly pair = signal<Pair | null>(null);
  readonly remoteContacts = signal<RemoteContact[]>([]);
  readonly inventory = signal(0);
  readonly sales = signal(0);
  readonly bonus = signal(0);

  constructor(
    private route: ActivatedRoute,
    private deviceService: DeviceService,
    private sqlite: SqliteService,
    private userService: UserService,
    private nav: NavController,
  ) {
    addIcons({ add });
  }

  async ngOnInit(): Promise<void> {
    const pairId = this.route.snapshot.paramMap.get('pairId')!;
    const pair = this.deviceService.pairs().find(p => p.id === pairId) ?? null;
    this.pair.set(pair);
    await this.loadData();
    this.loading.set(false);
  }

  async doRefresh(event: any): Promise<void> {
    await this.loadData();
    event.target.complete();
  }

  private async loadData(): Promise<void> {
    const pair = this.pair();
    if (!pair) return;

    const contacts = await this.sqlite.query<RemoteContact>(
      'SELECT * FROM remote_contacts WHERE pairId = ? ORDER BY name', [pair.id]
    );
    this.remoteContacts.set(contacts);

    const userId = this.userService.user()!.id;
    const links = await this.sqlite.query<any>(
      'SELECT inventoryBalance, salesBalance, bonusBalance FROM courier_links WHERE courier = ?', [userId]
    );
    if (links[0]) {
      this.inventory.set(links[0].inventoryBalance ?? 0);
      this.sales.set(links[0].salesBalance ?? 0);
      this.bonus.set(links[0].bonusBalance ?? 0);
    }
  }

  bookIncome(contact: RemoteContact): void {
    this.nav.navigateForward(['/tabs/transactions/create'], {
      queryParams: { contactId: contact.id, contactName: contact.name },
    });
  }
}
