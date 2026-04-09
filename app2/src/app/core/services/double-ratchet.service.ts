import { Injectable } from '@angular/core';
import { CryptoService } from './crypto.service';
import { SqliteService } from './sqlite.service';

interface RatchetState {
  pairId: string;
  rootKey: string;
  sendChainKey: string;
  receiveChainKey: string;
  sendCounter: number;
  receiveCounter: number;
  myEphemeralPublic: string;
  myEphemeralPrivate: string;
  theirEphemeralPublic: string;
  updated: string;
}

@Injectable({ providedIn: 'root' })
export class DoubleRatchetService {

  constructor(private crypto: CryptoService, private sqlite: SqliteService) {}

  async initRatchet(pairId: string, sharedSecret: ArrayBuffer, isInitiator: boolean): Promise<void> {
    const rootKeyBuf = await this.crypto.hkdfExpand(sharedSecret, 'ratchet-root', 32);
    const sendBuf = await this.crypto.hkdfExpand(sharedSecret, isInitiator ? 'ratchet-send' : 'ratchet-recv', 32);
    const recvBuf = await this.crypto.hkdfExpand(sharedSecret, isInitiator ? 'ratchet-recv' : 'ratchet-send', 32);
    const ephemeral = await this.crypto.generateKeyPair();

    const state: RatchetState = {
      pairId,
      rootKey: this.crypto.bufferToBase64(rootKeyBuf),
      sendChainKey: this.crypto.bufferToBase64(sendBuf),
      receiveChainKey: this.crypto.bufferToBase64(recvBuf),
      sendCounter: 0,
      receiveCounter: 0,
      myEphemeralPublic: JSON.stringify(ephemeral.publicKey),
      myEphemeralPrivate: JSON.stringify(ephemeral.privateKey),
      theirEphemeralPublic: '',
      updated: new Date().toISOString(),
    };
    await this.sqlite.upsert('ratchet_state', state);
  }

  async encryptMessage(pairId: string, plaintext: string): Promise<{ ciphertext: string; counter: number; ephemeralKey: string }> {
    const state = await this.getState(pairId);
    if (!state) throw new Error('No ratchet state for pair ' + pairId);

    const chainKeyBuf = this.crypto.base64ToBuffer(state.sendChainKey).buffer as ArrayBuffer;
    const messageKeyBuf = await this.crypto.hkdfExpand(chainKeyBuf, `msg-${state.sendCounter}`, 32);
    const nextChainBuf = await this.crypto.hkdfExpand(chainKeyBuf, 'chain-advance', 32);

    const aesKey = await crypto.subtle.importKey('raw', messageKeyBuf, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const cipherBytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encoded);

    const combined = new Uint8Array(iv.length + cipherBytes.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherBytes), iv.length);

    const counter = state.sendCounter;
    state.sendChainKey = this.crypto.bufferToBase64(nextChainBuf);
    state.sendCounter++;
    state.updated = new Date().toISOString();
    await this.sqlite.upsert('ratchet_state', state);

    return {
      ciphertext: btoa(String.fromCharCode(...combined)),
      counter,
      ephemeralKey: state.myEphemeralPublic,
    };
  }

  async decryptMessage(pairId: string, ciphertext: string, counter: number): Promise<string> {
    const state = await this.getState(pairId);
    if (!state) throw new Error('No ratchet state for pair ' + pairId);

    const chainKeyBuf = this.crypto.base64ToBuffer(state.receiveChainKey).buffer as ArrayBuffer;

    let currentChain = chainKeyBuf;
    for (let i = state.receiveCounter; i < counter; i++) {
      currentChain = await this.crypto.hkdfExpand(currentChain, 'chain-advance', 32);
    }

    const messageKeyBuf = await this.crypto.hkdfExpand(currentChain, `msg-${counter}`, 32);
    const nextChainBuf = await this.crypto.hkdfExpand(currentChain, 'chain-advance', 32);

    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    const aesKey = await crypto.subtle.importKey('raw', messageKeyBuf, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, encrypted);

    state.receiveChainKey = this.crypto.bufferToBase64(nextChainBuf);
    state.receiveCounter = counter + 1;
    state.updated = new Date().toISOString();
    await this.sqlite.upsert('ratchet_state', state);

    return new TextDecoder().decode(decrypted);
  }

  async hasState(pairId: string): Promise<boolean> {
    const state = await this.getState(pairId);
    return state !== null;
  }

  private async getState(pairId: string): Promise<RatchetState | null> {
    return this.sqlite.getById<RatchetState>('ratchet_state', pairId);
  }
}
