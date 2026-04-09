import { Component, computed, OnInit, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonModal,
  IonButton,
  IonButtons,
  IonSearchbar,
  IonList,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, qrCode } from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { DeviceService } from '../../../../core/services/device.service';
import { EncryptedSyncService } from '../../../../core/services/encrypted-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserService } from '../../../../core/services/user.service';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { ContactListItemComponent } from '../../components/contact-list-item/contact-list-item.component';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
    IonModal,
    IonButton,
    IonButtons,
    IonSearchbar,
    IonList,
    TranslateModule,
    QrScannerComponent,
    ContactListItemComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tabs.contacts' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openScanner()">
            <ion-icon name="qr-code" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar (ionInput)="onSearch($event)" [placeholder]="'contact.search' | translate" />
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else if (filteredContacts().length === 0 && !searchTerm()) {
        <div style="display:flex;flex-direction:column;align-items:center;padding:60px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">📖</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">{{ 'contact.welcome' | translate }}</div>
          <div style="font-size:14px;color:#888;">{{ 'contact.welcomeHint' | translate }}</div>
        </div>
      } @else {
        <ion-list>
          @for (contact of filteredContacts(); track contact.id) {
            <app-contact-list-item [contact]="contact" />
          }
        </ion-list>
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="createContact()">
          <ion-icon name="add" />
        </ion-fab-button>
      </ion-fab>

      <ion-modal [isOpen]="showScanModal()" (didDismiss)="showScanModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Scannen</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="showScanModal.set(false)">{{ 'cancel' | translate }}</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <app-qr-scanner (scanned)="onQrScanned($event)" />
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
})
export class ContactListPage implements OnInit {
  readonly loading = signal(true);
  readonly showScanModal = signal(false);
  readonly searchTerm = signal('');

  readonly filteredContacts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.contactService.contacts()
      .filter(c => !term || c.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  constructor(
    public contactService: ContactService,
    private deviceService: DeviceService,
    private encryptedSync: EncryptedSyncService,
    private toast: ToastService,
    private auth: UserService,
    private alertCtrl: AlertController,
    private nav: NavController,
    private translate: TranslateService,
  ) {
    addIcons({ add, qrCode });
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

  onSearch(event: any): void {
    this.searchTerm.set(event.detail.value ?? '');
  }

  async createContact(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('contact.create'),
      inputs: [{ name: 'name', type: 'text' as const, placeholder: this.translate.instant('contact.name') }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' as const },
        {
          text: this.translate.instant('contact.create'),
          handler: async (d: { name: string }) => {
            if (!d.name?.trim()) return false;
            const contact = await this.contactService.create(d.name.trim());
            if (contact) {
              await this.nav.navigateForward(['/tabs/contacts', contact.id]);
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async openScanner(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(t => t.stop());
      this.showScanModal.set(true);
    } catch {
      this.showManualInput();
    }
  }

  async showManualInput(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'QR-Daten einf\u00fcgen',
      message: 'Kamera nicht verf\u00fcgbar. QR-Daten manuell einf\u00fcgen:',
      inputs: [{ name: 'data', type: 'textarea' as const, placeholder: '{"deviceId":"..."}' }],
      buttons: [
        { text: this.translate.instant('cancel'), role: 'cancel' as const },
        { text: this.translate.instant('contact.link'), handler: (d: { data: string }) => { if (d.data?.trim()) this.onQrScanned(d.data.trim()); } },
      ],
    });
    await alert.present();
  }

  async onQrScanned(data: string): Promise<void> {
    this.showScanModal.set(false);
    try {
      const parsed = JSON.parse(data);
      const { deviceId, publicKey, contactId, ownerName } = parsed;

      const displayName = ownerName || 'Unbekannt';

      await this.deviceService.createPair(
        '',
        deviceId,
        publicKey,
        displayName,
        'viewer',
        contactId,
      );

      const myName = this.auth.user()?.username || 'Unbekannt';
      await this.encryptedSync.sendPairingRequest(deviceId, contactId, '', myName);

      this.toast.success('Verlinkt mit ' + displayName);
      this.nav.navigateForward('/tabs/profile');
    } catch (e) {
      this.toast.error('QR-Code ung\u00fcltig');
    }
  }
}
