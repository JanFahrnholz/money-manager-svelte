import { Component, output, signal } from '@angular/core';
import { IonGrid, IonRow, IonCol, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-numpad',
  standalone: true,
  imports: [IonGrid, IonRow, IonCol, IonButton],
  template: `
    <ion-grid>
      @for (row of keys; track $index) {
        <ion-row>
          @for (key of row; track key) {
            <ion-col>
              <ion-button
                expand="block"
                [fill]="key === '\u232B' ? 'solid' : 'outline'"
                [color]="key === '\u232B' ? 'danger' : 'medium'"
                (click)="press(key)"
                class="numpad-btn"
              >
                {{ key }}
              </ion-button>
            </ion-col>
          }
        </ion-row>
      }
    </ion-grid>
  `,
  styles: `
    .numpad-btn {
      --height: 52px;
      --border-radius: 12px;
      --border-color: #555;
      font-size: 20px;
    }
  `,
})
export class NumpadComponent {
  readonly valueChange = output<number>();

  readonly raw = signal('0');

  readonly keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '\u232B'],
  ];

  press(key: string): void {
    let current = this.raw();

    if (key === '\u232B') {
      current = current.length > 1 ? current.slice(0, -1) : '0';
    } else if (key === '.') {
      if (!current.includes('.')) {
        current = current + '.';
      }
    } else {
      if (current.includes('.')) {
        const decimals = current.split('.')[1] ?? '';
        if (decimals.length >= 2) return;
      }
      current = current === '0' ? key : current + key;
    }

    this.raw.set(current);
    this.valueChange.emit(parseFloat(current) || 0);
  }
}
