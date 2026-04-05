import { AfterViewInit, Component, computed, output, signal } from '@angular/core';
import { IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';

export type Timeframe = '1w' | '1m' | '3m' | '6m' | '1y' | 'max' | 'month';

export function getStartDate(tf: Timeframe): Date | null {
  if (tf === 'max' || tf === 'month') return null;

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

export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

const timeframes: Timeframe[] = ['1w', '1m', '3m', '6m', '1y', 'max'];

@Component({
  selector: 'app-timeframe-selector',
  standalone: true,
  imports: [IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, TranslateModule],
  template: `
    <ion-segment [value]="segmentValue()" (ionChange)="onChange($event)">
      @for (tf of timeframes; track tf) {
        <ion-segment-button [value]="tf">
          <ion-label>{{ 'timeframe.' + tf | translate }}</ion-label>
        </ion-segment-button>
      }
    </ion-segment>
    @if (showMonthNav()) {
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:8px 0;">
        <ion-button fill="clear" size="small" (click)="prevMonth()">
          <ion-icon name="chevron-back" slot="icon-only" />
        </ion-button>
        <span style="font-size:14px;font-weight:600;min-width:140px;text-align:center;color:#fff;">
          {{ monthLabel() }}
        </span>
        <ion-button fill="clear" size="small" (click)="nextMonth()">
          <ion-icon name="chevron-forward" slot="icon-only" />
        </ion-button>
      </div>
    }
  `,
})
export class TimeframeSelectorComponent implements AfterViewInit {
  readonly value = signal<Timeframe>('max');
  readonly change = output<Timeframe>();
  readonly monthChange = output<{ month: number; year: number }>();
  readonly timeframes = timeframes;

  readonly showMonthNav = signal(false);
  readonly activeMonth = signal(new Date().getMonth());
  readonly activeYear = signal(new Date().getFullYear());

  readonly segmentValue = computed(() => {
    const v = this.value();
    return v === 'month' ? '1m' : v;
  });

  readonly monthLabel = computed(() => {
    const d = new Date(this.activeYear(), this.activeMonth());
    return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  });

  constructor() {
    addIcons({ chevronBack, chevronForward });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.value.set(this.value()), 50);
  }

  onChange(event: CustomEvent): void {
    const tf = event.detail.value as Timeframe;
    if (tf === '1m') {
      this.showMonthNav.set(true);
      this.activeMonth.set(new Date().getMonth());
      this.activeYear.set(new Date().getFullYear());
      this.value.set('month');
      this.change.emit('month');
      this.monthChange.emit({ month: this.activeMonth(), year: this.activeYear() });
    } else {
      this.showMonthNav.set(false);
      this.value.set(tf);
      this.change.emit(tf);
    }
  }

  prevMonth(): void {
    if (this.activeMonth() === 0) {
      this.activeMonth.set(11);
      this.activeYear.update(y => y - 1);
    } else {
      this.activeMonth.update(m => m - 1);
    }
    this.monthChange.emit({ month: this.activeMonth(), year: this.activeYear() });
  }

  nextMonth(): void {
    if (this.activeMonth() === 11) {
      this.activeMonth.set(0);
      this.activeYear.update(y => y + 1);
    } else {
      this.activeMonth.update(m => m + 1);
    }
    this.monthChange.emit({ month: this.activeMonth(), year: this.activeYear() });
  }
}
