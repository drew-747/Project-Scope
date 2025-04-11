declare module '@stablelib/random' {
  export function randomBytes(length: number): Uint8Array;
}

declare module '@stablelib/hkdf' {
  export class HKDF {
    constructor(hash: any, ikm: Uint8Array, salt?: Uint8Array, info?: Uint8Array);
    expand(length: number): Uint8Array;
  }
}

declare module '@stablelib/sha256' {
  export class SHA256 {
    constructor();
    update(data: Uint8Array): this;
    digest(): Uint8Array;
  }
}

declare module '@stablelib/chacha20poly1305' {
  export class ChaCha20Poly1305 {
    constructor(key: Uint8Array);
    seal(nonce: Uint8Array, plaintext: Uint8Array): Uint8Array;
    open(nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array | null;
  }
}

declare module 'tweetnacl' {
  export interface KeyPair {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
  }

  export const box: {
    keyPair(): KeyPair;
    before(publicKey: Uint8Array, secretKey: Uint8Array): Uint8Array;
  };

  export const sign: {
    keyPair(): KeyPair;
    detached(message: Uint8Array, secretKey: Uint8Array): Uint8Array;
  };
} 