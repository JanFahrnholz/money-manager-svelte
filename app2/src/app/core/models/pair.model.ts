export interface Pair {
  id: string;
  localContactId: string;    // empty for viewer pairs
  remoteDeviceId: string;
  remotePublicKey: string;
  sharedKey: string;
  label: string;
  role: string;              // 'viewer' | 'courier' | '' (legacy)
  remoteContactId: string;   // contact ID on the owner's device
  created: string;
}
