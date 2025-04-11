# Contributing to SecureChat

Thank you for your interest in contributing to SecureChat! This document provides technical guidelines and instructions for contributing to the project.

## Project Structure

The project is organized into several workspaces:
- `shared/` - Common code shared between mobile and desktop applications
  - `src/crypto.ts` - Cryptographic operations (X3DH, Double Ratchet)
  - `src/types.ts` - Type definitions for cryptographic operations
- `mobile/` - React Native mobile application
- `desktop/` - Electron desktop application
- `server/` - Go backend server implementing secure messaging protocols

## Development Setup

1. **Prerequisites**
   - Node.js v18+ (LTS version recommended)
   - npm v9+
   - Go 1.21+ (for server development)
   - Git
   - For mobile development:
     - Android Studio / Xcode
     - React Native CLI
   - For desktop development:
     - Electron Builder

2. **Installation**
   ```bash
   # Clone the repository
   git clone [repository-url]
   cd securechat

   # Install dependencies for all workspaces
   npm install

   # Install Go dependencies
   cd server
   go mod download
   ```

## Cryptographic Implementation Guidelines

1. **Key Management**
   - Use `@stablelib/random` for cryptographically secure random number generation
   - Implement proper key storage using platform-specific secure storage
   - Follow X3DH protocol for initial key exchange
   - Implement Double Ratchet algorithm for message encryption

2. **Encryption Standards**
   - Use ChaCha20-Poly1305 for message encryption
   - Implement HKDF for key derivation
   - Use SHA-256 for hashing operations
   - Follow the Signal Protocol specifications for cryptographic operations

3. **Security Considerations**
   - Never store private keys in plaintext
   - Implement proper key rotation mechanisms
   - Use constant-time comparisons for cryptographic operations
   - Validate all cryptographic inputs
   - Implement proper error handling for cryptographic operations

## Development Workflow

1. **Branch Naming Convention**
   ```bash
   # Feature branches
   git checkout -b feature/secure-message-encryption
   
   # Bug fix branches
   git checkout -b fix/key-rotation-issue
   
   # Documentation branches
   git checkout -b docs/security-guidelines
   ```

2. **Commit Message Format**
   ```
   <type>(<scope>): <description>

   [optional body]
   [optional footer]
   ```
   Types: feat, fix, docs, style, refactor, test, chore
   Scope: crypto, mobile, desktop, server

3. **Code Review Process**
   - All cryptographic changes require security review
   - Changes to shared crypto code require two maintainer approvals
   - Security-sensitive changes must include threat model analysis

## Technical Standards

1. **TypeScript Guidelines**
   ```typescript
   // Use strict type checking
   interface PreKeyBundle {
     identityKey: Uint8Array;
     signedPreKey: Uint8Array;
     signedPreKeySignature: Uint8Array;
     oneTimePreKey: Uint8Array;
     registrationId: number;
   }

   // Document cryptographic functions
   /**
    * Implements X3DH key agreement protocol
    * @param theirPreKeyBundle - Remote user's pre-key bundle
    * @returns Session state for secure messaging
    */
   async function initiateSession(theirPreKeyBundle: PreKeyBundle): Promise<SessionState>
   ```

2. **Testing Requirements**
   - Unit tests for all cryptographic functions
   - Integration tests for end-to-end encryption
   - Performance tests for cryptographic operations
   - Security tests for key management
   - Test coverage minimum: 90%

3. **Performance Considerations**
   - Optimize cryptographic operations for mobile devices
   - Implement proper key caching mechanisms
   - Use WebAssembly for performance-critical crypto operations
   - Profile memory usage in cryptographic operations

## Security Review Process

1. **Cryptographic Changes**
   - Document security assumptions
   - Provide proof of security properties
   - Include threat model analysis
   - List potential attack vectors

2. **Code Review Checklist**
   - [ ] No hardcoded keys or secrets
   - [ ] Proper error handling for crypto operations
   - [ ] Input validation for all cryptographic functions
   - [ ] Constant-time comparisons where required
   - [ ] Proper key storage implementation
   - [ ] Secure memory handling
   - [ ] No debug logging of sensitive data

## Building and Testing

1. **Build Process**
   ```bash
   # Build shared crypto library
   npm run build:shared

   # Run cryptographic tests
   npm run test:crypto

   # Run security audits
   npm run audit:security
   ```

2. **Security Testing**
   - Static analysis using ESLint security plugins
   - Dependency vulnerability scanning
   - Cryptographic implementation verification
   - Side-channel attack testing

## Questions?

For technical questions about the cryptographic implementation, open an issue with the `crypto` label. 
