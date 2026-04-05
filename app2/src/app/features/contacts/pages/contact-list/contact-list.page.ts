import { Component, computed, OnInit, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonList,
  IonFab,
  IonFabButton,
  IonIcon,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, personAddOutline } from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { ContactListItemComponent } from '../../components/contact-list-item/contact-list-item.component';

type FilterMode = 'all' | 'owned' | 'linked';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonItem,
    IonList,
    IonFab,
    IonFabButton,
    IonIcon,
    IonAlert,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    TranslateModule,
    ContactListItemComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tabs.contacts' | translate }}</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [placeholder]="'search' | translate"
          (ionInput)="onSearch($event)"
          [debounce]="200"
        />
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="filter()" (ionChange)="onFilterChange($event)">
          <ion-segment-button value="all">
            <ion-label>{{ 'all' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="owned">
            <ion-label>{{ 'owned' | translate }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="linked">
            <ion-label>{{ 'linked' | translate }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>
      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else {
        <ion-list lines="inset">
          @for (contact of filteredContacts(); track contact.id) {
            <app-contact-list-item [contact]="contact" />
          } @empty {
            <div style="text-align:center;padding:60px 24px;">
              <ion-icon name="person-add-outline" style="font-size:64px;color:#666;display:block;margin:0 auto 16px;" />
              <h3 style="color:#fff;margin-bottom:8px;">{{ 'contact.welcome' | translate }}</h3>
              <p style="color:#888;font-size:14px;line-height:1.5;margin-bottom:24px;">
                {{ 'contact.welcomeHint' | translate }}
              </p>
            </div>
          }
        </ion-list>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="alertOpen.set(true)">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-alert
        [isOpen]="alertOpen()"
        [header]="'contact.create' | translate"
        [inputs]="alertInputs"
        [buttons]="alertButtons"
        (didDismiss)="alertOpen.set(false)"
      />
    </ion-content>
  `,
})
export class ContactListPage implements OnInit {
  readonly loading = signal(true);
  readonly searchTerm = signal('');
  readonly filter = signal<FilterMode>('all');
  readonly alertOpen = signal(false);

  readonly alertInputs = [
    {
      name: 'name',
      type: 'text' as const,
      placeholder: 'Name',
    },
  ];

  readonly alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel' as const,
    },
    {
      text: 'OK',
      handler: (data: { name: string }) => {
        const name = data.name?.trim();
        if (name) {
          this.contactService.create(name);
        }
      },
    },
  ];

  readonly filteredContacts = computed(() => {
    let list =
      this.filter() === 'owned'
        ? this.contactService.owned()
        : this.filter() === 'linked'
          ? this.contactService.linked()
          : this.contactService.contacts();

    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter((c) => c.name.toLowerCase().includes(term));
    }

    return list;
  });

  constructor(private contactService: ContactService) {
    addIcons({ add, personAddOutline });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    await this.contactService.loadAll();
    this.loading.set(false);
  }

  async doRefresh(event: any): Promise<void> {
    await this.contactService.loadAll();
    event.target.complete();
  }

  onSearch(event: CustomEvent): void {
    this.searchTerm.set((event.detail.value ?? '').toString());
  }

  onFilterChange(event: CustomEvent): void {
    this.filter.set(event.detail.value as FilterMode);
  }
}
