import {
  crypto_pwhash,
  crypto_pwhash_ALG_ARGON2ID13,
  crypto_pwhash_SALTBYTES,
} from 'react-native-libsodium';
import { randomBytes } from './sodium';

const KEY_BYTES = 32;
const OPS_LIMIT = 3;
const MEM_LIMIT = 64 * 1024 * 1024;

export const KDF_PARAMS_VERSION = 1;

export type KdfParams = {
  v: number;
  alg: 'argon2id';
  ops: number;
  mem: number;
  saltB64: string;
};

export function newKdfSalt(): Uint8Array {
  return randomBytes(crypto_pwhash_SALTBYTES);
}

export function deriveKey(passphrase: string, salt: Uint8Array): Uint8Array {
  if (passphrase.length === 0) throw new Error('empty passphrase');
  return crypto_pwhash(
    KEY_BYTES,
    passphrase,
    salt,
    OPS_LIMIT,
    MEM_LIMIT,
    crypto_pwhash_ALG_ARGON2ID13,
  );
}

export function kdfParams(salt: Uint8Array, saltB64: string): KdfParams {
  return {
    v: KDF_PARAMS_VERSION,
    alg: 'argon2id',
    ops: OPS_LIMIT,
    mem: MEM_LIMIT,
    saltB64,
  };
}
