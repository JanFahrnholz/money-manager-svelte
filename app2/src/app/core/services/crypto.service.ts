import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CryptoService {

  async generateKeyPair(): Promise<{ publicKey: JsonWebKey; privateKey: JsonWebKey }> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'X25519' },
      true,
      ['deriveBits'],
    );
    const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    return { publicKey, privateKey };
  }

  async deriveSharedBits(myPrivateKeyJwk: JsonWebKey, theirPublicKeyJwk: JsonWebKey): Promise<ArrayBuffer> {
    const privateKey = await crypto.subtle.importKey(
      'jwk', myPrivateKeyJwk, { name: 'X25519' }, false, ['deriveBits'],
    );
    const publicKey = await crypto.subtle.importKey(
      'jwk', theirPublicKeyJwk, { name: 'X25519' }, false, [],
    );
    return crypto.subtle.deriveBits(
      { name: 'X25519', public: publicKey },
      privateKey,
      256,
    );
  }

  async deriveSharedKey(myPrivateKeyJwk: JsonWebKey, theirPublicKeyJwk: JsonWebKey): Promise<string> {
    const sharedBits = await this.deriveSharedBits(myPrivateKeyJwk, theirPublicKeyJwk);
    const ikm = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
    const aesKey = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode('MoneyManager-v2') },
      ikm,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
    const raw = await crypto.subtle.exportKey('raw', aesKey);
    return this.bufferToBase64(raw);
  }

  async hkdfExpand(ikm: ArrayBuffer, info: string, length: number): Promise<ArrayBuffer> {
    const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(info) },
      key,
      length * 8,
    );
  }

  async encrypt(sharedKeyBase64: string, plaintext: string): Promise<string> {
    const key = await this.importAesKey(sharedKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return this.bufferToBase64(combined.buffer);
  }

  async decrypt(sharedKeyBase64: string, payload: string): Promise<string> {
    const key = await this.importAesKey(sharedKeyBase64);
    const data = this.base64ToBuffer(payload);
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  async hashPairId(deviceIdA: string, deviceIdB: string): Promise<string> {
    const sorted = [deviceIdA, deviceIdB].sort().join(':');
    const encoded = new TextEncoder().encode(sorted);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return this.bufferToBase64(hash).slice(0, 22);
  }

  private async importAesKey(base64: string): Promise<CryptoKey> {
    const raw = this.base64ToBuffer(base64);
    return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
}
