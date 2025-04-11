# SecureChat

A modern, secure end-to-end encrypted messenger with multi-device support and metadata protection.

## Features

- 🔒 End-to-end encryption using the Signal Protocol
- 🔄 Multi-device support with secure sync
- 🕶️ Metadata protection with sealed sender
- 💥 Self-destructing messages
- 📱 Cross-platform (iOS, Android, Desktop)
- 🎯 Real-time message delivery
- 🔐 Forward secrecy
- 👥 Contact verification

## Architecture

The project is structured as a monorepo containing:

- `/mobile` - React Native mobile app
- `/desktop` - Electron desktop app
- `/server` - Go backend server
- `/shared` - Shared TypeScript/JavaScript libraries
- `/proto` - Protocol buffer definitions

## Security Features

- Double Ratchet Algorithm for message encryption
- X3DH (Extended Triple Diffie-Hellman) for initial key agreement
- Pre-keys for asynchronous initial messaging
- Sealed sender for metadata protection
- Safety number verification
- Secure key storage
- Forward and backward secrecy

## Development Setup

### Prerequisites

- Node.js 18+
- Go 1.20+
- React Native development environment
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/securechat.git
cd securechat
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install mobile app dependencies
cd mobile && npm install
cd ..

# Install desktop app dependencies
cd desktop && npm install
cd ..

# Install server dependencies
cd server && go mod download
cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start development servers:
```bash
# Start mobile app
cd mobile && npm run start

# Start desktop app
cd desktop && npm run dev

# Start backend server
cd server && go run cmd/main.go
```

## Security Considerations

- All encryption operations use constant-time implementations
- Keys are securely stored using platform-specific secure storage
- Network traffic is protected against timing attacks
- Push notifications contain no message content
- Contact lists are stored encrypted
- Perfect forward secrecy is maintained

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Signal Protocol specifications
- OMEMO Multi-End Message and Object Encryption
- Matrix Protocol for federation concepts 