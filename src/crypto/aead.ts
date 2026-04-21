import {
  crypto_aead_xchacha20poly1305_ietf_encrypt,
  crypto_aead_xchacha20poly1305_ietf_decrypt,
  crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
} from 'react-native-libsodium';
import { fromBase64, randomBytes, toBase64 } from './sodium';

export type SealedBox = {
  nonceB64: string;
  ctB64: string;
};

export function seal(plaintext: Uint8Array, key: Uint8Array, ad: string = ''): SealedBox {
  const nonce = randomBytes(crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
  const ct = crypto_aead_xchacha20poly1305_ietf_encrypt(plaintext, ad, null, nonce, key);
  return { nonceB64: toBase64(nonce), ctB64: toBase64(ct) };
}

export function open(sealed: SealedBox, key: Uint8Array, ad: string = ''): Uint8Array {
  const nonce = fromBase64(sealed.nonceB64);
  const ct = fromBase64(sealed.ctB64);
  return crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, ad, nonce, key);
}
