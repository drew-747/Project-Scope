export { CryptoManager } from './crypto';
export * from './types';

// Constants
export const PROTOCOL_VERSION = '1.0.0';
export const MAX_SKIP_MESSAGE_KEYS = 1000;
export const MAX_MESSAGE_KEYS = 2000;
export const PRE_KEY_BUNDLE_SIZE = 100;

// Error types
export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionError';
  }
}

export class PreKeyBundleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreKeyBundleError';
  }
} 