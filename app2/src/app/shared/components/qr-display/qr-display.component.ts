import { Component, input, ElementRef, viewChild, effect } from '@angular/core';
import QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display',
  standalone: true,
  template: `<canvas #canvas style="width:100%;max-width:280px;margin:0 auto;display:block;"></canvas>`,
})
export class QrDisplayComponent {
  data = input.required<string>();
  canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const data = this.data();
      if (el && data) {
        QRCode.toCanvas(el, data, {
          width: 280,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
    });
  }
}
