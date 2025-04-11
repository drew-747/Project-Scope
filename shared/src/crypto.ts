import { randomBytes } from '@stablelib/random';
import { box, sign } from 'tweetnacl';
import { HKDF } from '@stablelib/hkdf';
import { SHA256 } from '@stablelib/sha256';
import { ChaCha20Poly1305 } from '@stablelib/chacha20poly1305';
import { PreKeyBundle, SessionState, Message, DeviceKeys } from './types';

const KEY_LEN = 32;

export class CryptoManager {
  private static instance: CryptoManager;
  private deviceKeys?: DeviceKeys;

  private constructor() {}

  public static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
    }
    return CryptoManager.instance;
  }

  public async initialize(): Promise<void> {
    if (!this.deviceKeys) {
      this.deviceKeys = await this.generateDeviceKeys();
    }
  }

  public getDeviceKeys(): DeviceKeys {
    if (!this.deviceKeys) {
      throw new Error('CryptoManager not initialized');
    }
    return this.deviceKeys;
  }

  private async generateDeviceKeys(): Promise<DeviceKeys> {
    const identityKeyPair = box.keyPair();
    const signedPreKeyPair = box.keyPair();
    const oneTimePreKeyPairs = Array(20).fill(null).map(() => box.keyPair());
    const registrationId = Math.floor(Math.random() * 16384);

    return {
      identityKeyPair: {
        publicKey: identityKeyPair.publicKey,
        secretKey: identityKeyPair.secretKey
      },
      signedPreKeyPair: {
        publicKey: signedPreKeyPair.publicKey,
        secretKey: signedPreKeyPair.secretKey
      },
      oneTimePreKeyPairs: oneTimePreKeyPairs.map(pair => ({
        publicKey: pair.publicKey,
        secretKey: pair.secretKey
      })),
      registrationId
    };
  }

  public async createPreKeyBundle(): Promise<PreKeyBundle> {
    if (!this.deviceKeys) {
      throw new Error('CryptoManager not initialized');
    }

    const oneTimePreKeyPair = this.deviceKeys.oneTimePreKeyPairs[0];
    const signatureKeyPair = sign.keyPair();
    
    const signedPreKeySignature = sign.detached(
      this.deviceKeys.signedPreKeyPair.publicKey,
      signatureKeyPair.secretKey
    );

    return {
      identityKey: this.deviceKeys.identityKeyPair.publicKey,
      signedPreKey: this.deviceKeys.signedPreKeyPair.publicKey,
      signedPreKeySignature,
      oneTimePreKey: oneTimePreKeyPair.publicKey,
      registrationId: this.deviceKeys.registrationId
    };
  }

  public async initiateSession(theirPreKeyBundle: PreKeyBundle): Promise<SessionState> {
    if (!this.deviceKeys) {
      throw new Error('CryptoManager not initialized');
    }

    // X3DH Key Agreement
    const ephemeralKeyPair = box.keyPair();
    const sharedSecrets = [
      // DH1 = DH(IKA, SPKB)
      box.before(theirPreKeyBundle.signedPreKey, this.deviceKeys.identityKeyPair.secretKey),
      // DH2 = DH(EKA, IKB)
      box.before(theirPreKeyBundle.identityKey, ephemeralKeyPair.secretKey),
      // DH3 = DH(EKA, SPKB)
      box.before(theirPreKeyBundle.signedPreKey, ephemeralKeyPair.secretKey),
      // DH4 = DH(EKA, OPKB)
      box.before(theirPreKeyBundle.oneTimePreKey, ephemeralKeyPair.secretKey)
    ];

    // KDF(DH1 || DH2 || DH3 || DH4)
    const totalLength = sharedSecrets.reduce((acc, secret) => acc + secret.length, 0);
    const combinedSecrets = new Uint8Array(totalLength);
    let offset = 0;
    for (const secret of sharedSecrets) {
      combinedSecrets.set(secret, offset);
      offset += secret.length;
    }
    const hkdf = new HKDF(SHA256, combinedSecrets);
    const rootKey = hkdf.expand(KEY_LEN);
    const chainKey = hkdf.expand(KEY_LEN);

    return {
      rootKey,
      chainKey,
      sendingRatchetKey: box.keyPair(),
      receivingRatchetKey: new Uint8Array(KEY_LEN),
      sendingChainKey: new Uint8Array(KEY_LEN),
      receivingChainKey: new Uint8Array(KEY_LEN),
      messageKeys: new Map(),
      previousSendingChainLength: 0
    };
  }

  public async encrypt(plaintext: Uint8Array, sessionState: SessionState): Promise<Message> {
    // Derive message key using Double Ratchet
    const messageKey = await this.deriveMessageKey(sessionState.chainKey);
    
    // Encrypt message
    const cipher = new ChaCha20Poly1305(messageKey);
    const nonce = randomBytes(12);
    const ciphertext = cipher.seal(nonce, plaintext);

    return {
      header: {
        publicKey: sessionState.sendingRatchetKey.publicKey,
        numberOfMessagesInPreviousChain: sessionState.previousSendingChainLength,
        messageNumber: 0
      },
      ciphertext
    };
  }

  private async deriveMessageKey(chainKey: Uint8Array): Promise<Uint8Array> {
    const hkdf = new HKDF(SHA256, chainKey);
    return hkdf.expand(KEY_LEN);
  }

  public async decrypt(message: Message, sessionState: SessionState): Promise<Uint8Array> {
    const messageKey = sessionState.messageKeys.get(message.header.messageNumber);
    if (!messageKey) {
      throw new Error('Message key not found');
    }

    const cipher = new ChaCha20Poly1305(messageKey);
    const nonce = message.ciphertext.slice(0, 12);
    const ciphertext = message.ciphertext.slice(12);
    
    const decrypted = cipher.open(nonce, ciphertext);
    if (!decrypted) {
      throw new Error('Failed to decrypt message');
    }
    return decrypted;
  }
} 