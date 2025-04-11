export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface PreKeyBundle {
  identityKey: Uint8Array;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  oneTimePreKey: Uint8Array;
  registrationId: number;
}

export interface SessionState {
  rootKey: Uint8Array;
  chainKey: Uint8Array;
  sendingRatchetKey: KeyPair;
  receivingRatchetKey: Uint8Array;
  sendingChainKey: Uint8Array;
  receivingChainKey: Uint8Array;
  messageKeys: Map<number, Uint8Array>;
  previousSendingChainLength: number;
}

export interface Message {
  header: MessageHeader;
  ciphertext: Uint8Array;
}

export interface MessageHeader {
  publicKey: Uint8Array;
  numberOfMessagesInPreviousChain: number;
  messageNumber: number;
}

export interface EncryptedMessage {
  type: 'message' | 'prekey';
  header: MessageHeader;
  ciphertext: Uint8Array;
  preKeyBundle?: PreKeyBundle;
}

export interface DecryptedMessage {
  plaintext: Uint8Array;
  senderIdentity: Uint8Array;
}

export interface DeviceKeys {
  identityKeyPair: KeyPair;
  signedPreKeyPair: KeyPair;
  oneTimePreKeyPairs: KeyPair[];
  registrationId: number;
}

export interface Contact {
  id: string;
  identityKey: Uint8Array;
  sessions: Map<number, SessionState>;
} 