import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthLockService {
  readonly locked = signal(false);
  readonly pinEnabled = signal(false);

  constructor() {
    this.pinEnabled.set(!!localStorage.getItem('pin_hash'));
  }

  async setPin(pin: string): Promise<void> {
    const hash = await this.hashPin(pin);
    localStorage.setItem('pin_hash', hash);
    this.pinEnabled.set(true);
  }

  async verifyPin(pin: string): Promise<boolean> {
    const stored = localStorage.getItem('pin_hash');
    if (!stored) return true;
    const hash = await this.hashPin(pin);
    if (hash === stored) {
      this.locked.set(false);
      return true;
    }
    return false;
  }

  removePin(): void {
    localStorage.removeItem('pin_hash');
    this.pinEnabled.set(false);
    this.locked.set(false);
  }

  lock(): void {
    if (this.pinEnabled()) {
      this.locked.set(true);
    }
  }

  private async hashPin(pin: string): Promise<string> {
    const data = new TextEncoder().encode(pin + ':MoneyManager-PIN');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
}
