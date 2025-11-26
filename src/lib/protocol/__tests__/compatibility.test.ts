import * as fs from 'fs';
import * as path from 'path';
import { unpackKeyShare, Algorithm, KEY_SHARE_VERSION } from '@/lib/protocol/keyShare';
import { unpackEncryptedPayload, ENCRYPTED_PAYLOAD_VERSION } from '@/lib/protocol/encryptedPayload';
import { DATA_ARCHIVE_VERSION } from '@/lib/protocol/dataArchive';
import { reconstructSecret } from '@/lib/encryption/core';
import type { RecoverDataArchiveInput } from '@/lib/encryption/types';
import type { DataArchive } from '@/lib/protocol/dataArchive';
import { arraysEqual } from '@/lib/__tests__/testUtils';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const GENERATED_DIR = path.join(FIXTURES_DIR, 'generated');
const SHARE_FIXTURES_DIR = path.join(GENERATED_DIR, 'key-shares');
const PAYLOAD_FIXTURES_DIR = path.join(GENERATED_DIR, 'encrypted-payloads');
const PLAINTEXTS_DIR = path.join(FIXTURES_DIR, 'plaintexts');
const KEY_SHARE_V1 = 'v1';
const ENCRYPTED_PAYLOAD_V1 = 'v1';
const DATA_ARCHIVE_V1 = 'data-archive-v1';

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
    formatVersion?: number;
}

interface DataArchiveTestCaseConfig {
    algorithm: string;
    plaintextRef: string | string[];
    archiveType: 'text' | 'files' | 'mixed';
    compressionUsed: boolean;
    encryptedChunkVersion?: number;
    dataArchiveVersion?: number;
}

/**
 * Load main config with shared crypto materials
 */
function loadMainConfig(): MainConfig {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Load share test case config
 */
function loadShareConfig(shareVersion: string, testCaseName: string): KeyShareTestCaseConfig {
    const configPath = path.join(SHARE_FIXTURES_DIR, shareVersion, testCaseName, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Load dataArchive test case config
 */
function loadDataArchiveConfig(dataVersion: string, dataArchiveVersion: string, testCaseName: string): DataArchiveTestCaseConfig {
    const configPath = path.join(PAYLOAD_FIXTURES_DIR, dataVersion, dataArchiveVersion, testCaseName, 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Load all share binaries for a test case
 */
function loadShareBinaries(shareVersion: string, testCaseName: string): Uint8Array[] {
    const testCaseDir = path.join(SHARE_FIXTURES_DIR, shareVersion, testCaseName);
    const files = fs.readdirSync(testCaseDir)
        .filter(f => f.startsWith('share-') && f.endsWith('.bin'))
        .sort(); // Sort to ensure consistent order

    return files.map(file => {
        const filePath = path.join(testCaseDir, file);
        return new Uint8Array(fs.readFileSync(filePath));
    });
}

/**
 * Load data binaries for a test case
 */
function loadDataBinaries(dataVersion: string, dataArchiveVersion: string, testCaseName: string): Uint8Array[] {
    const testCaseDir = path.join(PAYLOAD_FIXTURES_DIR, dataVersion, dataArchiveVersion, testCaseName);
    const files = fs.readdirSync(testCaseDir)
        .filter(f => f.startsWith('data-') && f.endsWith('.bin'))
        .sort(); // Sort to ensure consistent order

    return files.map(file => {
        const filePath = path.join(testCaseDir, file);
        return new Uint8Array(fs.readFileSync(filePath));
    });
}

/**
 * Load plaintext reference file(s)
 */
function loadPlaintexts(filenameOrArray: string | string[]): Uint8Array[] {
    const filenames = Array.isArray(filenameOrArray) ? filenameOrArray : [filenameOrArray];
    return filenames.map(filename => {
        const filepath = path.join(PLAINTEXTS_DIR, filename);
        return new Uint8Array(fs.readFileSync(filepath));
    });
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = Buffer.from(base64, 'base64');
    return new Uint8Array(binaryString);
}

/**
 * Helper to test a combination of share and dataArchive versions
 */
async function testVersionCombination(
    shareVersion: string,
    shareTestCase: string,
    dataVersion: string,
    dataArchiveVersion: string,
    dataArchiveTestCase: string
) {
    // Load configs
    const mainConfig = loadMainConfig();
    const shareConfig = loadShareConfig(shareVersion, shareTestCase);
    const dataArchiveConfig = loadDataArchiveConfig(dataVersion, dataArchiveVersion, dataArchiveTestCase);

    // Load binary files
    const shareBinaries = loadShareBinaries(shareVersion, shareTestCase);
    const dataBinaries = loadDataBinaries(dataVersion, dataArchiveVersion, dataArchiveTestCase);

    // Decode and validate share blocks
    const decodedShares = shareBinaries.map((binary, index) => {
        const decoded = unpackKeyShare(binary);

        // Cross-reference with config
        expect(decoded.id).toBe(mainConfig.id);
        expect(decoded.threshold).toBe(shareConfig.threshold);
        expect(decoded.totalShares).toBe(shareConfig.totalShares);
        expect(decoded.shareIndex).toBe(index);
        expect(decoded.algorithm).toBe(mainConfig.algorithms[shareConfig.algorithm].algorithmId);

        // Verify IV matches main config
        const expectedIv = base64ToUint8Array(mainConfig.algorithms[shareConfig.algorithm].iv);
        expect(arraysEqual(decoded.iv as Uint8Array, expectedIv)).toBe(true);

        return decoded;
    });

    // Decode and validate data blocks
    const decodedData = dataBinaries.map(binary => {
        const decoded = unpackEncryptedPayload(binary);

        // Cross-reference with config
        expect(decoded.id).toBe(mainConfig.id);

        return decoded;
    });

    // Test decryption with minimum required shares (threshold)
    const minShares = decodedShares.slice(0, shareConfig.threshold);
    const keySharesForDecryption = Array.from(minShares.map(s => s.keyShare)) as Uint8Array<ArrayBuffer>[];
    const ciphertextChunks = decodedData.map(d => d.ciphertext);

    const recoverInput: RecoverDataArchiveInput = {
        algorithm: decodedShares[0].algorithm as Algorithm,
        keyShares: keySharesForDecryption,
        chunks: ciphertextChunks,
        iv: decodedShares[0].iv
    };

    // Decrypt and recover dataArchive
    const recoveredDataArchive = await reconstructSecret(recoverInput);

    // Load original plaintext(s) for comparison
    const originalPlaintexts = loadPlaintexts(dataArchiveConfig.plaintextRef);

    // Verify dataArchive type matches
    expect(recoveredDataArchive.type).toBe(dataArchiveConfig.archiveType);

    // Verify recovered dataArchive matches original based on type
    if (dataArchiveConfig.archiveType === 'text') {
        expect(recoveredDataArchive.type).toBe('text');
        if (recoveredDataArchive.type === 'text') {
            const originalText = new TextDecoder().decode(originalPlaintexts[0]);
            expect(recoveredDataArchive.content).toBe(originalText);
        }
    } else if (dataArchiveConfig.archiveType === 'files') {
        expect(recoveredDataArchive.type).toBe('files');
        if (recoveredDataArchive.type === 'files') {
            const plaintextRefs = Array.isArray(dataArchiveConfig.plaintextRef) ? dataArchiveConfig.plaintextRef : [dataArchiveConfig.plaintextRef];
            expect(recoveredDataArchive.files.length).toBe(plaintextRefs.length);

            plaintextRefs.forEach((ref, index) => {
                expect(recoveredDataArchive.files[index].name).toBe(ref);
                expect(arraysEqual(recoveredDataArchive.files[index].content, originalPlaintexts[index])).toBe(true);
            });
        }
    }
}

/**
 * Helper to test different share combinations (threshold validation)
 */
async function testShareCombinations(
    shareVersion: string,
    shareTestCase: string,
    dataVersion: string,
    dataArchiveVersion: string,
    dataArchiveTestCase: string
) {
    const shareConfig = loadShareConfig(shareVersion, shareTestCase);
    const shareBinaries = loadShareBinaries(shareVersion, shareTestCase);
    const dataBinaries = loadDataBinaries(dataVersion, dataArchiveVersion, dataArchiveTestCase);

    const createRecoverInput = (shares: any[]): RecoverDataArchiveInput => {
        const decoded = shares.map(b => unpackKeyShare(b));
        const keyShares = Array.from(decoded.map(s => s.keyShare)) as Uint8Array<ArrayBuffer>[];
        const ciphertextChunks = dataBinaries.map(b => unpackEncryptedPayload(b).ciphertext);

        return {
            algorithm: decoded[0].algorithm as Algorithm,
            keyShares,
            chunks: ciphertextChunks,
            iv: decoded[0].iv
        };
    };

    // Test that we need at least threshold shares
    if (shareConfig.threshold > 1) {
        const insufficientShares = shareBinaries.slice(0, shareConfig.threshold - 1);
        const recoverInput = createRecoverInput(insufficientShares);

        // This should fail with insufficient shares
        await expect(reconstructSecret(recoverInput)).rejects.toThrow();
    }

    // Test that any valid combination of threshold shares works
    if (shareConfig.totalShares > shareConfig.threshold) {
        // Try a different combination (e.g., last shares instead of first)
        const alternativeShares = shareBinaries.slice(-shareConfig.threshold);
        const recoverInput = createRecoverInput(alternativeShares);

        // This should succeed
        const recovered = await reconstructSecret(recoverInput);
        expect(recovered).toBeDefined();

        // For 3of5, test middle shares too (shares 1, 2, 3)
        if (shareConfig.totalShares === 5 && shareConfig.threshold === 3) {
            const middleShares = shareBinaries.slice(1, 4); // indices 1, 2, 3
            const recoverInputMiddle = createRecoverInput(middleShares);

            const recoveredMiddle = await reconstructSecret(recoverInputMiddle);
            expect(recoveredMiddle).toBeDefined();
        }
    }
}

describe('Backward Compatibility Tests', () => {
    describe('fixture coverage guardrail', () => {
        it('has fixtures for the current protocol versions', () => {
            const shareVersionDir = path.join(SHARE_FIXTURES_DIR, `v${KEY_SHARE_VERSION}`);
            const payloadVersionDir = path.join(PAYLOAD_FIXTURES_DIR, `v${ENCRYPTED_PAYLOAD_VERSION}`);
            const archiveVersionDir = path.join(payloadVersionDir, `data-archive-v${DATA_ARCHIVE_VERSION}`);

            if (!fs.existsSync(shareVersionDir)) {
                throw new Error(`Missing key share fixtures for version v${KEY_SHARE_VERSION}. Run the fixture generator before committing.`);
            }

            if (!fs.existsSync(payloadVersionDir)) {
                throw new Error(`Missing encrypted payload fixtures for version v${ENCRYPTED_PAYLOAD_VERSION}. Run the fixture generator before committing.`);
            }

            if (!fs.existsSync(archiveVersionDir)) {
                throw new Error(`Missing data archive fixtures for version data-archive-v${DATA_ARCHIVE_VERSION}. Run the fixture generator before committing.`);
            }
        });
    });

    describe('key-share-v1 + encrypted-payload-v1/data-archive-v1', () => {
        describe('2of3 + text-only', () => {
            it('should decrypt text archive with current code', async () => {
                await testVersionCombination(KEY_SHARE_V1, '2of3', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'text-only');
            });

            it('should respect threshold requirements', async () => {
                await testShareCombinations(KEY_SHARE_V1, '2of3', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'text-only');
            });
        });

        describe('3of5 + text-only', () => {
            it('should decrypt text archive with current code', async () => {
                await testVersionCombination(KEY_SHARE_V1, '3of5', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'text-only');
            });

            it('should succeed with various valid share combinations (first 3, last 3, middle 3)', async () => {
                await testShareCombinations(KEY_SHARE_V1, '3of5', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'text-only');
            });
        });

        describe('2of3 + text-as-file', () => {
            it('should decrypt text wrapped as file dataArchive', async () => {
                await testVersionCombination(KEY_SHARE_V1, '2of3', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'text-as-file');
            });
        });



        describe('2of3 + precompressed', () => {
            it('should handle precompressed data (no re-compression)', async () => {
                await testVersionCombination(KEY_SHARE_V1, '2of3', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'precompressed');
            });
        });

        describe('3of5 + files-multiple', () => {
            it('should decrypt multiple files archive', async () => {
                await testVersionCombination(KEY_SHARE_V1, '3of5', ENCRYPTED_PAYLOAD_V1, DATA_ARCHIVE_V1, 'files-multiple');
            });
        });
    });

    // Future test blocks for mixed versions:
    // describe('key-share-v2 + encrypted-payload-v1/data-archive-v1', () => { ... });
    // describe('key-share-v1 + encrypted-payload-v2/data-archive-v1', () => { ... });
    // describe('key-share-v1 + encrypted-payload-v2/data-archive-v2', () => { ... });
});
