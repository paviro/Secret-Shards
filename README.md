# Secret Shards

Securely split your secrets using Shamir's Secret Sharing. Encrypt files or text, distribute the shares, and recover them only when enough shares are combined.

🌐 **Live Version:** [https://secret-shards.de](https://secret-shards.de)

## Features

- **Encrypt & Split**: Encrypt text or files and split them into multiple shares
- **Shamir's Secret Sharing**: Uses cryptographic secret sharing to split encryption keys
- **Flexible Configuration**: Choose how many shares to generate (N) and how many are needed to recover (K)
- **PDF Generation**: Automatically generates PDF documents with QR codes for each share
- **QR Code Scanning**: Scan QR codes from PDFs, pictures or via your camera to decrypt your data
- **Geocache Mode**: Specialized scanner for collecting multi-part secrets in physical locations (e.g. scavenger hunts)
- **Client-Side Encryption**: All encryption happens in your browser - your secrets never leave your device

## How It Works

1. **Encrypt Mode**:
   - Enter text and/or select files
   - Configure the number of shares (N) and threshold (K)
   - The application encrypts your data and splits the encryption key using Shamir's Secret Sharing
   - PDFs are generated for each share, containing QR codes with the key share and data (for small files)
   - Download the PDFs and encrypted data file

2. **Decrypt Mode**:
   - Scan QR codes from the PDF files and select the encrypted data file
   - When enough shares are combined (meeting the threshold), the secret is automatically decrypted
   - Download the recovered files or view the decrypted text

3. **Geocache Mode**:
   - Designed for outdoor adventures and scavenger hunts
   - Persistent session storage: scans are saved to your device so you can close the browser between locations
   - Full-screen scanner with progress tracking for shares and data chunks
   - Automatically decrypts once all required parts are collected
   - Explicit session management to clear data when finished

## Technical Details

### Encryption
- Uses AES encryption to the data
- Shamir's Secret Sharing for key splitting (using [`shamir-secret-sharing`](https://www.npmjs.com/package/shamir-secret-sharing) library)
- All cryptographic operations happen client-side in the browser

### PDF Generation
- Each share is embedded in a PDF with QR codes
- PDFs include metadata about the share configuration and how the binary format of the QR codes work

### Geocache Mode
- Uses LocalStorage to persist scanned shares and data chunks across browser sessions
- Prevents data loss when moving between physical locations
- Session data remains until explicitly cleared or a new session is started

### Security
- **Zero Trust**: No data is sent to any server
- **Client-Side Only**: All encryption/decryption happens in your browser
- **No Tracking**: No analytics or tracking scripts

⚠️ **Browser Extension Warning**: Be cautious when using browser extensions (password managers, form fillers, translation tools, etc.) as they may have access to read data from text fields and could potentially leak your secrets. For maximum security, consider using a private/incognito window and disabling extensions when working with sensitive data.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/paviro/Secret-Shards
cd Secret-Shards
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

---

## Disclaimer

**Important**: This application processes highly sensitive data. Please read and understand the following before use:

- **Source Code Verification**: Always verify the source code before using this application with important secrets. Review the cryptographic implementation to ensure it meets your security requirements.

- **AI-Assisted Development**: This software was created with the assistance of AI tools. While the code has been reviewed, users are responsible for verifying its security and correctness for their specific use cases.

- **No Warranty**: This software is provided "as-is" without any warranties, expressed or implied. The hosted version at [secret-shards.de](https://secret-shards.de) is provided for convenience only.

- **User Responsibility**: You are solely responsible for:
  - Verifying the security and correctness of the implementation
  - Ensuring proper handling and storage of your encrypted shares
  - Any loss or compromise of data resulting from the use of this software
  - Compliance with applicable laws and regulations regarding data encryption and storage

- **Use at Your Own Risk**: By using this software, you acknowledge that you understand these risks and agree to use it at your own risk.
