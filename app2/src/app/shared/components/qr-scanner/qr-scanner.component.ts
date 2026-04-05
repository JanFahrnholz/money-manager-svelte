import { Component, output, signal, OnDestroy, AfterViewInit } from '@angular/core';
import { IonText } from '@ionic/angular/standalone';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [IonText],
  template: `
    <div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;"></div>
    @if (error()) {
      <ion-text color="danger" style="display:block;text-align:center;margin-top:8px;">
        <p>{{ error() }}</p>
      </ion-text>
    }
  `,
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  scanned = output<string>();
  error = signal('');
  private scanner: Html5Qrcode | null = null;

  async ngAfterViewInit() {
    try {
      this.scanner = new Html5Qrcode('qr-reader');
      await this.scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => {
          this.scanned.emit(text);
          this.stop();
        },
        () => {},
      );
    } catch (e: any) {
      this.error.set(e.message || 'Camera access denied');
    }
  }

  private async stop() {
    try {
      await this.scanner?.stop();
    } catch {}
  }

  async ngOnDestroy() {
    await this.stop();
  }
}
