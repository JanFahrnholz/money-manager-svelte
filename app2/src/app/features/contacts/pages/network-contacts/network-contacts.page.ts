import { Component, computed, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  IonAlert,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, personAddOutline } from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import { DeviceService } from '../../../../core/services/device.service';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { ContactListItemComponent } from '../../components/contact-list-item/contact-list-item.component';
import type { Contact } from '../../../../core/models/contact.model';

interface RemoteContact {
  id: string;
  pairId: string;
  name: string;
  balance: number;
  score: number;
  created: string;
  updated: string;
}

@Component({
  selector: 'app-network-contacts',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonAlert,
    RouterLink,
    TranslateModule,
    EuroPipe,
    ContactListItemComponent,
  ],
  template: `
    @if (isOwnNetwork()) {
      <!-- Own network view -->
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/tabs/network" [text]="'back' | translate" />
          </ion-buttons>
          <ion-title>{{ 'network.myNetwork' | translate }}</ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar [placeholder]="'search' | translate" (ionInput)="onSearch($event)" />
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
          <ion-refresher-content />
        </ion-refresher>
        <ion-list lines="inset">
          @for (contact of filteredContacts(); track contact.id) {
            <app-contact-list-item [contact]="contact" />
          } @empty {
            <div style="text-align:center;padding:60px 24px;">
              <ion-icon name="person-add-outline" style="font-size:64px;color:#666;display:block;margin:0 auto 16px;" />
              <p style="color:#888;">{{ 'contact.welcomeHint' | translate }}</p>
            </div>
          }
        </ion-list>
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button (click)="showCreateAlert = true">
            <ion-icon name="add" />
          </ion-fab-button>
        </ion-fab>
        <ion-alert
          [isOpen]="showCreateAlert"
          header="Neuer Kontakt"
          [inputs]="[{ name: 'name', type: 'text', placeholder: 'Name' }]"
          [buttons]="createAlertButtons"
          (didDismiss)="showCreateAlert = false"
        />
      </ion-content>
    } @else {
      <!-- Agent network view -->
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-back-button defaultHref="/tabs/network" [text]="'back' | translate" />
          </ion-buttons>
          <ion-title>{{ networkLabel() }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
          <ion-refresher-content />
        </ion-refresher>
        <!-- Agent info banner -->
        <div style="padding:16px;display:flex;gap:16px;justify-content:center;">
          <div style="text-align:center;">
            <div style="font-size:11px;color:#888;">{{ 'courier.inventory' | translate }}</div>
            <div style="font-size:18px;font-weight:700;color:#ffd600;">{{ inventory() | euro }}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#888;">{{ 'courier.sales' | translate }}</div>
            <div style="font-size:18px;font-weight:700;color:#4cd964;">{{ sales() | euro }}</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:11px;color:#888;">{{ 'courier.bonus' | translate }}</div>
            <div style="font-size:18px;font-weight:700;color:#ff9500;">{{ bonus() | euro }}</div>
          </div>
        </div>
        <!-- Remote contacts list -->
        <ion-list lines="inset">
          @for (contact of remoteContacts(); track contact.id) {
            <ion-item>
              <ion-label>
                <h2>{{ contact.name }}</h2>
                <p>{{ contact.balance | euro }}</p>
              </ion-label>
              <ion-button slot="end" fill="clear" color="primary"
                [routerLink]="['/tabs/transactions/create']"
                [queryParams]="{contactId: contact.id, networkId: networkId()}">
                {{ 'courier.sellTo' | translate }}
              </ion-button>
            </ion-item>
          } @empty {
            <div style="text-align:center;padding:40px;color:#888;">
              {{ 'courier.noContactsSynced' | translate }}
            </div>
          }
        </ion-list>
      </ion-content>
    }
  `,
})
export class NetworkContactsPage implements OnInit {
  showCreateAlert = false;

  readonly networkId = signal('');
  readonly searchTerm = signal('');
  readonly remoteContacts = signal<RemoteContact[]>([]);
  readonly inventory = signal(0);
  readonly sales = signal(0);
  readonly bonus = signal(0);

  readonly isOwnNetwork = computed(() => this.networkId() === 'own');

  readonly networkLabel = computed(() => {
    const pair = this.deviceService.pairs().find(p => p.id === this.networkId());
    return pair?.label || 'Netzwerk';
  });

  readonly filteredContacts = computed(() => {
    const all = this.contactService.contacts()
      .filter(c => !c.networkId || c.networkId === 'own');
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return all;
    return all.filter(c => c.name.toLowerCase().includes(term));
  });

  readonly createAlertButtons = [
    { text: 'Abbrechen', role: 'cancel' as const },
    { text: 'Erstellen', handler: (data: { name: string }) => this.createContact(data) },
  ];

  constructor(
    private route: ActivatedRoute,
    public contactService: ContactService,
    private sqlite: SqliteService,
    private deviceService: DeviceService,
  ) {
    addIcons({ add, personAddOutline });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('networkId') ?? 'own';
    this.networkId.set(id);

    if (this.isOwnNetwork()) {
      await this.contactService.loadAll();
    } else {
      await this.loadRemoteData(id);
    }
  }

  async doRefresh(event: any): Promise<void> {
    if (this.isOwnNetwork()) {
      await this.contactService.loadAll();
    } else {
      await this.loadRemoteData(this.networkId());
    }
    event.target.complete();
  }

  onSearch(event: any): void {
    this.searchTerm.set(event.detail.value ?? '');
  }

  createContact(data: { name: string }): boolean {
    const name = data.name?.trim();
    if (!name) return false;
    this.contactService.create(name, undefined, 'own');
    return true;
  }

  private async loadRemoteData(pairId: string): Promise<void> {
    const contacts = await this.sqlite.query<RemoteContact>(
      'SELECT * FROM remote_contacts WHERE pairId = ? ORDER BY name ASC',
      [pairId],
    );
    this.remoteContacts.set(contacts);

    // Load courier link balances for this pair
    const links = await this.sqlite.query<{
      inventoryBalance: number;
      salesBalance: number;
      bonusBalance: number;
    }>(
      'SELECT inventoryBalance, salesBalance, bonusBalance FROM courier_links WHERE id = ? LIMIT 1',
      [pairId],
    );
    if (links.length > 0) {
      this.inventory.set(links[0].inventoryBalance);
      this.sales.set(links[0].salesBalance);
      this.bonus.set(links[0].bonusBalance);
    }
  }
}
