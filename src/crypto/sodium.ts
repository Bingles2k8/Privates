import {
  randombytes_buf,
  to_base64,
  from_base64,
  base64_variants,
} from 'react-native-libsodium';

export function randomBytes(n: number): Uint8Array {
  return randombytes_buf(n);
}

export function toBase64(bytes: Uint8Array): string {
  return to_base64(bytes, base64_variants.ORIGINAL);
}

export function fromBase64(s: string): Uint8Array {
  return from_base64(s, base64_variants.ORIGINAL);
}

export function toHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}
