import { Component, output, signal, OnDestroy, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonText, IonButton, IonInput, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [FormsModule, IonText, IonButton, IonInput, IonItem, IonLabel],
  template: `
    @if (!cameraFailed()) {
      <div id="qr-reader" style="width:100%;max-width:400px;margin:0 auto;"></div>
    }
    @if (error()) {
      <ion-text color="danger" style="display:block;text-align:center;margin-top:8px;">
        <p>{{ error() }}</p>
      </ion-text>
    }
    @if (cameraFailed()) {
      <div style="padding:24px;text-align:center;">
        <p style="color:#888;margin-bottom:16px;">Kamera nicht verfügbar. QR-Daten manuell einfügen:</p>
        <ion-item>
          <ion-input label="QR-Daten" labelPlacement="floating" [(ngModel)]="manualInput" placeholder="JSON einfügen..." />
        </ion-item>
        <ion-button expand="block" style="margin-top:12px;" (click)="submitManual()">Verlinken</ion-button>
      </div>
    }
  `,
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  scanned = output<string>();
  error = signal('');
  cameraFailed = signal(false);
  manualInput = '';
  private scanner: Html5Qrcode | null = null;
  private retryCount = 0;

  async ngAfterViewInit() {
    // Wait for the DOM element to be available (Ionic modal lazy rendering)
    await this.waitForElement('qr-reader', 2000);
    await this.startCamera();
  }

  private async startCamera(): Promise<void> {
    const el = document.getElementById('qr-reader');
    if (!el) {
      this.cameraFailed.set(true);
      this.error.set('Scanner-Element nicht gefunden');
      return;
    }

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
      const msg = e?.message || String(e);
      this.error.set(msg);
      this.cameraFailed.set(true);
    }
  }

  private waitForElement(id: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (document.getElementById(id) || this.retryCount > timeoutMs / 50) {
          resolve();
          return;
        }
        this.retryCount++;
        setTimeout(check, 50);
      };
      check();
    });
  }

  submitManual(): void {
    if (this.manualInput.trim()) {
      this.scanned.emit(this.manualInput.trim());
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
