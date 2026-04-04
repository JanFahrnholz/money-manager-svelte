import { Component, output, signal } from '@angular/core';
import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

export type Timeframe = '1w' | '1m' | '3m' | '6m' | '1y' | 'max';

export function getStartDate(tf: Timeframe): Date | null {
  if (tf === 'max') return null;

  const now = new Date();
  switch (tf) {
    case '1w':
      now.setDate(now.getDate() - 7);
      break;
    case '1m':
      now.setMonth(now.getMonth() - 1);
      break;
    case '3m':
      now.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      now.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      now.setFullYear(now.getFullYear() - 1);
      break;
  }
  return now;
}

const timeframes: Timeframe[] = ['1w', '1m', '3m', '6m', '1y', 'max'];

@Component({
  selector: 'app-timeframe-selector',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, TranslateModule],
  template: `
    <ion-segment [value]="value()" (ionChange)="onChange($event)">
      @for (tf of timeframes; track tf) {
        <ion-segment-button [value]="tf">
          <ion-label>{{ 'timeframe.' + tf | translate }}</ion-label>
        </ion-segment-button>
      }
    </ion-segment>
  `,
})
export class TimeframeSelectorComponent {
  readonly value = signal<Timeframe>('1m');
  readonly change = output<Timeframe>();
  readonly timeframes = timeframes;

  onChange(event: CustomEvent): void {
    const tf = event.detail.value as Timeframe;
    this.value.set(tf);
    this.change.emit(tf);
  }
}
