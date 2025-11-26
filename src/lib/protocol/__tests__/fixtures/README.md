# Backward Compatibility Test Fixtures

This directory contains test fixtures for backward compatibility testing of binary formats.

## Structure

```
fixtures/
├── config.json                     # Shared crypto materials for all backward compatibility cases
├── generate-test-fixtures.ts            # Script to generate fixtures
├── plaintexts/                     # Original unencrypted data
└── generated/                      # Generated test data (version matrix)
    ├── key-shares/
    │   └── v1/
    │       ├── 2of2/
    │       │   ├── config.json
    │       │   ├── share-0.bin
    │       │   └── share-1.bin
    │       └── ...
    └── encrypted-payloads/
        └── v1/
            └── data-archive-v1/
                ├── text-only/
                │   ├── config.json
                │   └── data-0.bin
                ├── text-as-file/
                │   └── ...
                └── ...
```

## Key Concepts

### Independent Versioning (Three Axes)

We need to track three different binary formats:

1. **Key share format** (`generated/key-shares/v*/*`) — produced by `packKeyShare`.
2. **Encrypted payload format** (`generated/encrypted-payloads/v*/...`) — produced by `packEncryptedPayload`.
3. **Data archive format** (`generated/encrypted-payloads/*/data-archive-v*/...`) — produced by `packDataArchive`.

Each axis evolves independently, so a single fixture is identified by both its **outer encrypted payload version** *and* its **inner data archive version**. Examples:

- key-share-v2 + encrypted-payload-v1/data-archive-v1 (new key share framing, old archive envelope)
- key-share-v2 + encrypted-payload-v2/data-archive-v1 (key shares and transport bumped together)
- key-share-v1 + encrypted-payload-v2/data-archive-v2 (new archive serialization with newer transport)

### Centralized Crypto Materials

The root `config.json` contains all shared cryptographic materials:
- AES encryption key (same for all test cases using AES)
- Initialization vector (IV)
- Encryption algorithm IDs
- UUID for all shares and data blocks

This allows us to:
- Generate key shares with different formats while keeping the same encrypted payload data (for same algo)
- Generate encrypted payloads/data archives with different formats while reusing key shares (for same algo)
- Test mixed-version scenarios realistically

### Validation-Only Configs

Each test case has its own `config.json` file that contains:
- **For shares**: threshold, totalShares, algorithm reference, share format version (for reference only)
- **For encrypted payloads/data archives**: algorithm reference, plaintext reference, compression flag, encrypted payload version, data archive version

**Important**: These configs are for **validation only**. Tests must decrypt using binary data alone, then cross-reference decoded metadata against the config to verify correctness.

## Adding New Test Fixtures

### When Key Share Format Changes (e.g., v1 → v2)

1. Increment `KEY_SHARE_VERSION` in `src/lib/protocol/keyShare.ts`.
2. Run `npm run generate-test-fixtures`. New key shares land in `generated/key-shares/v2`.
3. **Do not touch** existing encrypted payload directories; they remain valid transport for older share versions.
4. Add a new test suite in `compatibility.test.ts`, e.g. `describe('key-share-v2 + encrypted-payload-v1/data-archive-v1', ...)` so we exercise the new share framing with the oldest known archives.

### When Encrypted Chunk Format Changes (outer transport)

1. Increment `ENCRYPTED_PAYLOAD_VERSION` in `src/lib/protocol/encryptedPayload.ts`.
2. Run `npm run generate-test-fixtures`. Archives generated with the new transport will be written to `generated/encrypted-payloads/v2/data-archive-vX`.
3. Update/extend `compatibility.test.ts` matrix so we cover at least:
   - `key-share-v1 + encrypted-payload-v2/data-archive-v1` (old shares, new transport)
   - `key-share-v2 + encrypted-payload-v2/data-archive-v1` (if key share format changed as well)

### When Data Archive Format Changes (inner decrypted payload)

1. Increment `DATA_ARCHIVE_VERSION` in `src/lib/protocol/dataArchive.ts`.
2. Run `npm run generate-test-fixtures`. The new archive set will be placed under the current encrypted payload version at `generated/encrypted-payloads/vY/data-archive-v2`.
3. Keep all historic archive directories — they let us test upgrades without re-encrypting.
4. Add or update describe blocks such as `describe('key-share-v1 + encrypted-payload-v1/data-archive-v2', ...)`.

### Testing Mixed Versions

Because directories encode every axis we can easily mix & match:

```typescript
describe('key-share-v2 + encrypted-payload-v1/data-archive-v1', () => { /* ... */ });
describe('key-share-v1 + encrypted-payload-v2/data-archive-v1', () => { /* ... */ });
describe('key-share-v1 + encrypted-payload-v2/data-archive-v2', () => { /* ... */ });
describe('key-share-v2 + encrypted-payload-v2/data-archive-v2', () => { /* ... */ });
```

## Critical Rules

> [!WARNING]
> **Never delete old fixtures!** They are the ground truth for ensuring backward compatibility.

> [!IMPORTANT]
> **Commit all fixtures to git.** CI/CD needs them for automated testing.

## Running Tests

```bash
# Run all compatibility tests
npm test -- compatibility.test.ts

# Run specific test suite
npm test -- compatibility.test.ts -t "key-share-v1 + encrypted-payload-v1/data-archive-v1"
```

## Plaintext Files

The `plaintexts/` directory contains original unencrypted data:

- **text-multiline.txt** — multiline UTF-8 text that exercises whitespace + punctuation.
- **precompressed.bin** — already-compressed binary blob to make sure we respect the `COMPRESSION_NONE` path.
