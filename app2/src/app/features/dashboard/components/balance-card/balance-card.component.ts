import { Component, input } from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [IonCard, IonCardContent, TranslateModule],
  template: `
    <ion-card [style.border-left]="'4px solid ' + borderColor()">
      <ion-card-content class="card-body">
        <div class="card-label">{{ label() | translate }}</div>
        <div class="card-value" [style.color]="color()">
          {{ prefix() }}{{ value().toFixed(2) }}
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: `
    ion-card {
      margin: 0;
    }
    .card-body {
      text-align: center;
      padding: 12px 8px;
    }
    .card-label {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      margin-bottom: 4px;
    }
    .card-value {
      font-size: 22px;
      font-weight: 700;
    }
  `,
})
export class BalanceCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly color = input.required<string>();
  readonly prefix = input.required<string>();
  readonly borderColor = input.required<string>();
}
