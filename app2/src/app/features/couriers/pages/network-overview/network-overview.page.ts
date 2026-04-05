import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { EuroPipe } from '../../../../shared/pipes/euro.pipe';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { CourierService, NetworkNode } from '../../services/courier.service';
import { UserService } from '../../../../core/services/user.service';
import { ToastService } from '../../../../core/services/toast.service';
import type { CourierLink } from '../../../../core/models/courier-link.model';

interface FlatNode {
  link: CourierLink;
  courierName: string;
  depth: number;
  hasChildren: boolean;
}

@Component({
  selector: 'app-network-overview',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonNote,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    EuroPipe,
    RouterLink,
    TranslateModule,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/profile" [text]="'back' | translate" />
        </ion-buttons>
        <ion-title>{{ 'network.title' | translate }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="onInvite()">
            {{ 'network.invite' | translate }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Summary cards -->
      <ion-grid>
        <ion-row>
          <ion-col size="4">
            <ion-card>
              <ion-card-content class="summary-card">
                <div class="summary-value">{{ totalCouriers() }}</div>
                <div class="summary-label">{{ 'network.courierCount' | translate }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="4">
            <ion-card>
              <ion-card-content class="summary-card">
                <div class="summary-value">{{ totalInventory() | euro }}</div>
                <div class="summary-label">{{ 'network.totalInventory' | translate }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="4">
            <ion-card>
              <ion-card-content class="summary-card">
                <div class="summary-value">{{ totalRevenue() | euro }}</div>
                <div class="summary-label">{{ 'network.openRevenue' | translate }}</div>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <!-- Network tree -->
      @if (flatNodes().length === 0) {
        <ion-note class="empty-note">{{ 'network.empty' | translate }}</ion-note>
      } @else {
        <ion-list [inset]="true">
          @for (node of flatNodes(); track node.link.id) {
            <ion-item [routerLink]="['/tabs/profile/network', node.link.id]" detail
              [style.padding-left]="(node.depth * 24 + 16) + 'px'">
              <ion-avatar slot="start" style="width:32px;height:32px;">
                <div class="node-avatar">{{ node.courierName.charAt(0).toUpperCase() }}</div>
              </ion-avatar>
              <ion-label>
                <h3>{{ node.courierName }}</h3>
                <p>Inv: {{ node.link.inventoryBalance | euro }} &middot; Umsatz: {{ node.link.salesBalance | euro }} &middot; Bonus: {{ node.link.bonusBalance | euro }}</p>
              </ion-label>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [
    `
      .summary-card {
        text-align: center;
        padding: 8px 4px;
      }
      .summary-value {
        font-size: 18px;
        font-weight: bold;
      }
      .summary-label {
        font-size: 11px;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }
      .node-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--ion-color-primary);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }
      .empty-note {
        display: block;
        text-align: center;
        margin-top: 32px;
      }
    `,
  ],
})
export class NetworkOverviewPage implements OnInit {
  private readonly courierService = inject(CourierService);
  private readonly auth = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly tree = signal<NetworkNode[]>([]);

  readonly flatNodes = computed(() => {
    const treeValue = this.tree();
    const flat: FlatNode[] = [];
    const flatten = (nodes: NetworkNode[], depth: number) => {
      for (const node of nodes) {
        flat.push({
          link: node.link,
          courierName: node.courierName,
          depth,
          hasChildren: node.children.length > 0,
        });
        flatten(node.children, depth + 1);
      }
    };
    flatten(treeValue, 0);
    return flat;
  });

  readonly totalCouriers = computed(() => this.flatNodes().length);

  readonly totalInventory = computed(() =>
    this.flatNodes().reduce((sum, n) => sum + n.link.inventoryBalance, 0),
  );

  readonly totalRevenue = computed(() =>
    this.flatNodes().reduce((sum, n) => sum + n.link.salesBalance, 0),
  );

  async ngOnInit(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const result = await this.courierService.getNetworkTree(userId);
    this.tree.set(result);
  }

  onInvite(): void {
    this.toast.success(this.getComingSoonText());
  }

  private getComingSoonText(): string {
    return 'Coming soon';
  }
}
