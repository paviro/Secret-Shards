#!/usr/bin/env tsx
/**
 * Fixture Generator for Backward Compatibility Tests
 *
 * This script generates test fixtures for backward compatibility testing.
 * It creates encrypted shares and data blocks using the current binary format versions.
 *
 * Usage: npm run generate-test-fixtures
 *
 * When binary formats change (key share, encrypted payload, or data archive versions incremented), run this script
 * to generate a new set of fixtures for the new version. Never delete old fixtures!
 */

import * as fs from 'fs';
import * as path from 'path';
import { packKeyShare, Algorithm, KEY_SHARE_VERSION } from '../../keyShare';
import { packEncryptedPayload, ENCRYPTED_PAYLOAD_VERSION } from '../../encryptedPayload';
import { packDataArchive, DATA_ARCHIVE_VERSION } from '../../dataArchive';
import type { DataArchive, FileItem } from '../../dataArchive';
import { split } from '../../../encryption/crypto';


const FIXTURES_DIR = __dirname;
const PLAINTEXTS_DIR = path.join(FIXTURES_DIR, 'plaintexts');

interface MainConfig {
    id: string;
    algorithms: {
        [key: string]: {
            algorithmId: number;
            key: string;
            iv: string;
        };
    };
}

interface KeyShareTestCaseConfig {
    algorithm: string;
    threshold: number;
    totalShares: number;
    description: string;
}

interface DataArchiveTestCaseConfig {
    plaintextRef: string | string[]; // Single file or array 
    algorithm: string;
    compressionUsed: boolean;
    archiveType?: 'text' | 'files' | 'mixed'; // Override default behavior
}

// Load main config
function loadMainConfig(): MainConfig {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Load plaintext file
function loadPlaintext(filename: string): Uint8Array {
    const filepath = path.join(PLAINTEXTS_DIR, filename);
    return new Uint8Array(fs.readFileSync(filepath));
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = Buffer.from(base64, 'base64');
    return new Uint8Array(binaryString);
}

// Encrypt data using provided key and IV
async function encryptWithKey(
    data: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array
): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const ciphertextBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        cryptoKey,
        data as BufferSource
    );

    return new Uint8Array(ciphertextBuffer);
}

// Create payload from plaintext reference(s)
function createDataArchiveFromPlaintext(
    plaintextRef: string | string[],
    archiveType?: 'text' | 'files' | 'mixed'
): DataArchive {
    // Handle array of files (files or mixed payload)
    if (Array.isArray(plaintextRef)) {
        const files: FileItem[] = plaintextRef.map(filename => {
            const content = loadPlaintext(filename);
            const type = filename.endsWith('.txt') ? 'text/plain' : 'application/octet-stream';
            return { name: filename, type, content };
        });

        return {
            type: 'files',
            files
        };
    }

    // Single file
    const content = loadPlaintext(plaintextRef);

    // Override type if specified
    if (archiveType === 'files') {
        return {
            type: 'files',
            files: [{
                name: plaintextRef,
                type: plaintextRef.endsWith('.txt') ? 'text/plain' : 'application/octet-stream',
                content
            }]
        };
    }

    if (archiveType === 'text') {
        const text = new TextDecoder().decode(content);
        return {
            type: 'text',
            content: text
        };
    }

    // Default behavior: binary files become files payload, text files become text payload
    if (plaintextRef.endsWith('.bin') || plaintextRef.endsWith('.dat')) {
        return {
            type: 'files',
            files: [{
                name: plaintextRef,
                type: 'application/octet-stream',
                content
            }]
        };
    }

    // Text file - create text payload
    const text = new TextDecoder().decode(content);
    return {
        type: 'text',
        content: text
    };
}

// Check if fixtures already exist for this version
function fixturesExist(dir: string): boolean {
    if (!fs.existsSync(dir)) return false;

    // Check if directory has any .bin files
    const files = fs.readdirSync(dir);
    return files.some(f => f.endsWith('.bin'));
}

// Get plaintext refs as array
function getPlaintextRefs(ref: string | string[]): string[] {
    return Array.isArray(ref) ? ref : [ref];
}

// Generate share fixtures for a test case
async function generateKeyShareFixtures(
    outputDir: string,
    config: KeyShareTestCaseConfig,
    mainConfig: MainConfig,
    skipExisting: boolean
) {
    if (skipExisting && fixturesExist(outputDir)) {
        console.log(`    ⏭️  Skipping (already exists)`);
        return;
    }

    const algoConfig = mainConfig.algorithms[config.algorithm];
    const key = base64ToUint8Array(algoConfig.key);
    const iv = base64ToUint8Array(algoConfig.iv);

    console.log(`  Generating ${config.totalShares} shares (${config.threshold}-of-${config.totalShares})...`);

    // Split the key into shares
    const keyShares = await split(
        key as Uint8Array<ArrayBuffer>,
        config.totalShares,
        config.threshold
    );

    // Save each share
    fs.mkdirSync(outputDir, { recursive: true });

    for (let i = 0; i < keyShares.length; i++) {
        const shareBlock = packKeyShare(
            mainConfig.id,
            config.threshold,
            config.totalShares,
            i,
            keyShares[i],
            iv,
            algoConfig.algorithmId as Algorithm
        );

        const sharePath = path.join(outputDir, `share-${i}.bin`);
        fs.writeFileSync(sharePath, shareBlock);
        console.log(`    Created share-${i}.bin (${shareBlock.length} bytes)`);
    }

    // Save test case config
    const configPath = path.join(outputDir, 'config.json');

    fs.writeFileSync(
        configPath,
        JSON.stringify(
            {
                algorithm: config.algorithm,
                threshold: config.threshold,
                totalShares: config.totalShares,
                description: config.description,
                keyShareVersion: KEY_SHARE_VERSION
            },
            null,
            2
        )
    );
    console.log(`    Created config.json`);
}

// Generate payload fixtures for a test case
async function generateDataArchiveFixtures(
    outputDir: string,
    config: DataArchiveTestCaseConfig,
    mainConfig: MainConfig,
    skipExisting: boolean
) {
    if (skipExisting && fixturesExist(outputDir)) {
        console.log(`    ⏭️  Skipping (already exists)`);
        return;
    }

    const algoConfig = mainConfig.algorithms[config.algorithm];
    const key = base64ToUint8Array(algoConfig.key);
    const iv = base64ToUint8Array(algoConfig.iv);

    const plaintextRefs = getPlaintextRefs(config.plaintextRef);
    console.log(`  Generating encrypted data archive for ${plaintextRefs.join(', ')}...`);

    // Create payload from plaintext
    const payload = createDataArchiveFromPlaintext(config.plaintextRef, config.archiveType);

    // Pack and encrypt the payload
    const packedDataArchive = await packDataArchive(payload);
    const ciphertext = await encryptWithKey(packedDataArchive, key, iv);

    // Pack as data block
    const dataBlock = packEncryptedPayload(mainConfig.id, 0, 1, ciphertext);

    // Save encrypted data
    fs.mkdirSync(outputDir, { recursive: true });
    const dataPath = path.join(outputDir, 'data-0.bin');
    fs.writeFileSync(dataPath, dataBlock);
    console.log(`    Created data-0.bin (${dataBlock.length} bytes)`);

    // Calculate if compression was actually used
    const originalSize = plaintextRefs.reduce((sum, ref) => sum + loadPlaintext(ref).length, 0);
    const usedCompression = packedDataArchive.length < originalSize;

    // Save test case config
    const configPath = path.join(outputDir, 'config.json');
    fs.writeFileSync(
        configPath,
        JSON.stringify(
            {
                algorithm: config.algorithm,
                plaintextRef: config.plaintextRef,
                archiveType: payload.type,
                compressionUsed: usedCompression,
                encryptedChunkVersion: ENCRYPTED_PAYLOAD_VERSION,
                dataArchiveVersion: DATA_ARCHIVE_VERSION
            },
            null,
            2
        )
    );
    console.log(`    Created config.json (compression: ${usedCompression})`);
}

// Main execution
async function main() {
    console.log('🔧 Generating backward compatibility test fixtures...\n');

    const mainConfig = loadMainConfig();
    console.log(`📋 Using ID: ${mainConfig.id}`);
    console.log(`📋 Share format version: ${KEY_SHARE_VERSION}`);
    console.log(`📋 Data block format version: ${ENCRYPTED_PAYLOAD_VERSION}`);
    console.log(`📋 Data archive version: ${DATA_ARCHIVE_VERSION}\n`);

    // Check if --force flag is present
    const skipExisting = !process.argv.includes('--force');
    if (skipExisting) {
        console.log('ℹ️  Skipping existing fixtures (use --force to regenerate)\n');
    }

    // Define generic share test cases
    const shareTestCases: Array<{ name: string; config: KeyShareTestCaseConfig }> = [
        {
            name: '2of3',
            config: {
                algorithm: 'AES_GCM_256',
                threshold: 2,
                totalShares: 3,
                description: 'Standard 2-of-3 sharing'
            }
        },
        {
            name: '3of5',
            config: {
                algorithm: 'AES_GCM_256',
                threshold: 3,
                totalShares: 5,
                description: '3-of-5 sharing (good for testing combinations)'
            }
        },
        {
            name: '2of2',
            config: {
                algorithm: 'AES_GCM_256',
                threshold: 2,
                totalShares: 2,
                description: '2-of-2 sharing (all shares required)'
            }
        }
    ];

    // Define payload test cases with different types
    const dataArchiveTestCases: Array<{ name: string; config: DataArchiveTestCaseConfig }> = [
        {
            name: 'text-only',
            config: {
                plaintextRef: 'text-multiline.txt',
                algorithm: 'AES_GCM_256',
                compressionUsed: false,
                archiveType: 'text' // Text payload type
            }
        },
        {
            name: 'text-as-file',
            config: {
                plaintextRef: 'text-multiline.txt',
                algorithm: 'AES_GCM_256',
                compressionUsed: false,
                archiveType: 'files' // Text file wrapped as files payload
            }
        },
        {
            name: 'precompressed',
            config: {
                plaintextRef: 'precompressed.bin',
                algorithm: 'AES_GCM_256',
                compressionUsed: false  // Should not compress already compressed data
            }
        },
        {
            name: 'files-multiple',
            config: {
                plaintextRef: ['text-multiline.txt', 'precompressed.bin'],
                algorithm: 'AES_GCM_256',
                compressionUsed: false
            }
        }
    ];

    // Generate key share fixtures
    const shareDir = path.join(FIXTURES_DIR, 'generated', 'key-shares', `v${KEY_SHARE_VERSION}`);
    console.log(`📦 Generating key share fixtures under key-shares/v${KEY_SHARE_VERSION}:`);

    for (const testCase of shareTestCases) {
        console.log(`\n  Test case: ${testCase.name}`);
        const outputDir = path.join(shareDir, testCase.name);
        await generateKeyShareFixtures(outputDir, testCase.config, mainConfig, skipExisting);
    }

    // Generate encrypted payload + data archive fixtures
    const payloadDir = path.join(
        FIXTURES_DIR,
        'generated',
        'encrypted-payloads',
        `v${ENCRYPTED_PAYLOAD_VERSION}`,
        `data-archive-v${DATA_ARCHIVE_VERSION}`
    );
    console.log(`\n\n📦 Generating encrypted payload fixtures under encrypted-payloads/v${ENCRYPTED_PAYLOAD_VERSION}/data-archive-v${DATA_ARCHIVE_VERSION}:`);

    for (const testCase of dataArchiveTestCases) {
        console.log(`\n  Test case: ${testCase.name}`);
        const outputDir = path.join(payloadDir, testCase.name);
        await generateDataArchiveFixtures(outputDir, testCase.config, mainConfig, skipExisting);
    }

    console.log('\n\n✅ Fixture generation complete!');
    console.log('\n📁 Generated files:');
    console.log(`   - ${shareTestCases.length} key share configurations in generated/key-shares/v${KEY_SHARE_VERSION}/`);
    console.log(`   - ${dataArchiveTestCases.length} encrypted payload archives in generated/encrypted-payloads/v${ENCRYPTED_PAYLOAD_VERSION}/data-archive-v${DATA_ARCHIVE_VERSION}/`);
    console.log('\n💡 Run tests with: npm test -- compatibility.test.ts\n');
}

main().catch((err) => {
    console.error('❌ Error generating fixtures:', err);
    process.exit(1);
});
