import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowForward } from 'ionicons/icons';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { DeviceService } from '../../../../core/services/device.service';
import { SqliteService } from '../../../../core/services/sqlite.service';
import type { Pair } from '../../../../core/models/pair.model';

interface RemoteContact {
  id: string;
  pairId: string;
  name: string;
  balance: number;
  score: number;
}

interface RemoteTransaction {
  id: string;
  pairId: string;
  contactId: string;
  amount: number;
  type: string;
  date: string;
  info: string;
}

@Component({
  selector: 'app-linkage-detail',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
    DatePipe,
    RouterLink,
    TranslateModule,
    EuroPipe,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile/linkages" [text]="'back' | translate" />
        </ion-buttons>
        <ion-title>{{ pair()?.label }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      @if (pair()) {
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:13px;color:#888;">{{ pair()!.role === 'viewer' || pair()!.role === 'linked' ? 'Nur Lesen' : 'Agent' }} bei</div>
          <div style="font-size:20px;font-weight:700;">{{ pair()!.label }}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">{{ pair()!.role === 'courier' ? 'Agent' : 'Nur Lesen' }}</div>
        </div>

        @if (pair()!.role === 'courier') {
          <div style="text-align:center;padding:8px 0 16px;">
            <ion-button
              expand="block"
              [routerLink]="['/tabs/profile/courier-dashboard']"
            >
              Agent-Dashboard
              <ion-icon name="arrow-forward" slot="end" />
            </ion-button>
          </div>
        }

        @if (contact()) {
          <div style="text-align:center;padding:16px 0;">
            <div style="font-size:11px;color:#888;text-transform:uppercase;">Kontostand</div>
            <div style="font-size:32px;font-weight:700;" [style.color]="contact()!.balance < 0 ? '#ff3b30' : contact()!.balance > 0 ? '#4cd964' : '#ffd600'">
              {{ contact()!.balance | euro }}
            </div>
          </div>
        } @else {
          <div style="text-align:center;padding:24px;color:#666;">
            <p>Noch keine Daten synchronisiert.</p>
            <p style="font-size:12px;">Warte auf Daten vom Owner...</p>
          </div>
        }

        @if (transactions().length > 0) {
          <div style="padding:0 0 16px;">
            <div style="font-size:11px;font-weight:600;color:#666;text-transform:uppercase;margin-bottom:8px;">Transaktionen</div>
            <ion-list>
              @for (tx of transactions(); track tx.id) {
                <ion-item>
                  <ion-label>
                    <h3>{{ tx.type }}</h3>
                    <p>{{ tx.date | date:'dd.MM.yyyy' }}{{ tx.info ? ' \u2014 ' + tx.info : '' }}</p>
                  </ion-label>
                  <ion-note slot="end" [color]="tx.type === 'Income' || tx.type === 'Refund' ? 'success' : 'danger'" style="font-weight:600;">
                    {{ tx.amount | euro }}
                  </ion-note>
                </ion-item>
              }
            </ion-list>
          </div>
        }
      }
    </ion-content>
  `,
})
export class LinkageDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly deviceService = inject(DeviceService);
  private readonly sqlite = inject(SqliteService);

  readonly pair = signal<Pair | null>(null);
  readonly contact = signal<RemoteContact | null>(null);
  readonly transactions = signal<RemoteTransaction[]>([]);

  constructor() {
    addIcons({ arrowForward });
  }

  async ngOnInit(): Promise<void> {
    const pairId = this.route.snapshot.paramMap.get('pairId');
    if (!pairId) return;

    const found = this.deviceService.pairs().find(p => p.id === pairId);
    if (found) this.pair.set(found);

    const contacts = await this.sqlite.query<RemoteContact>(
      'SELECT * FROM remote_contacts WHERE pairId = ?',
      [pairId],
    );
    if (contacts.length > 0) this.contact.set(contacts[0]);

    const txs = await this.sqlite.query<RemoteTransaction>(
      'SELECT * FROM remote_transactions WHERE pairId = ? ORDER BY date DESC',
      [pairId],
    );
    this.transactions.set(txs);
  }
}
