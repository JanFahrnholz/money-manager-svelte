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
  IonCard,
  IonCardContent,
  IonBadge,
  AlertController,
  NavController,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { add, chevronForward, qrCode } from 'ionicons/icons';
import { ContactService } from '../../services/contact.service';
import { DeviceService } from '../../../../core/services/device.service';
import { EncryptedSyncService } from '../../../../core/services/encrypted-sync.service';
import { ToastService } from '../../../../core/services/toast.service';
import { UserService } from '../../../../core/services/user.service';
import { QrScannerComponent } from '../../../../shared/components/qr-scanner/qr-scanner.component';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';

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
    IonCard,
    IonCardContent,
    IonBadge,
    RouterLink,
    TranslateModule,
    QrScannerComponent,
    EuroPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ 'tabs.network' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="openScanner()">
            <ion-icon name="qr-code" slot="icon-only" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="doRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      @if (loading()) {
        <div style="display:flex;justify-content:center;padding:40px;"><ion-spinner /></div>
      } @else {
        <!-- Own Network Card -->
        <ion-card [routerLink]="['/tabs/network', 'own']" button style="margin:16px;">
          <ion-card-content>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:18px;font-weight:700;color:#fff;">{{ 'network.myNetwork' | translate }}</div>
                <div style="font-size:13px;color:#888;margin-top:4px;">{{ ownContactCount() }} {{ 'network.contacts' | translate }}</div>
              </div>
              <ion-icon name="chevron-forward" style="color:#666;font-size:20px;" />
            </div>
            <div style="display:flex;gap:16px;margin-top:12px;">
              <div>
                <div style="font-size:11px;color:#888;">{{ 'network.claims' | translate }}</div>
                <div style="font-size:16px;font-weight:600;color:#4cd964;">{{ claims() | euro }}</div>
              </div>
              <div>
                <div style="font-size:11px;color:#888;">{{ 'network.debts' | translate }}</div>
                <div style="font-size:16px;font-weight:600;color:#ff3b30;">{{ debts() | euro }}</div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Agent Network Cards -->
        @for (network of agentNetworks(); track network.pairId) {
          <ion-card [routerLink]="['/tabs/network', network.pairId]" button style="margin:0 16px 12px;">
            <ion-card-content>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:16px;font-weight:700;color:#fff;">{{ network.label }}</div>
                  <ion-badge color="warning" style="margin-top:4px;">Agent</ion-badge>
                </div>
                <ion-icon name="chevron-forward" style="color:#666;font-size:20px;" />
              </div>
              <div style="display:flex;gap:16px;margin-top:12px;">
                <div>
                  <div style="font-size:11px;color:#888;">{{ 'courier.inventory' | translate }}</div>
                  <div style="font-size:14px;font-weight:600;color:#ffd600;">{{ network.inventory | euro }}</div>
                </div>
                <div>
                  <div style="font-size:11px;color:#888;">{{ 'courier.sales' | translate }}</div>
                  <div style="font-size:14px;font-weight:600;color:#4cd964;">{{ network.sales | euro }}</div>
                </div>
                <div>
                  <div style="font-size:11px;color:#888;">{{ 'network.contacts' | translate }}</div>
                  <div style="font-size:14px;font-weight:600;">{{ network.contactCount }}</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button [routerLink]="['/tabs/network', 'own']">
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

  readonly ownContactCount = computed(() =>
    this.contactService.contacts().filter(c => !c.networkId || c.networkId === 'own').length,
  );

  readonly claims = computed(() =>
    this.contactService.contacts()
      .filter(c => (!c.networkId || c.networkId === 'own') && c.balance < 0)
      .reduce((sum, c) => sum + Math.abs(c.balance), 0),
  );

  readonly debts = computed(() =>
    this.contactService.contacts()
      .filter(c => (!c.networkId || c.networkId === 'own') && c.balance > 0)
      .reduce((sum, c) => sum + c.balance, 0),
  );

  readonly agentNetworks = computed(() => {
    return this.deviceService.pairs()
      .filter(p => p.role === 'courier')
      .map(p => ({
        pairId: p.id,
        label: p.label || 'Unbekannt',
        inventory: 0,
        sales: 0,
        contactCount: 0,
      }));
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
    addIcons({ add, chevronForward, qrCode });
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
