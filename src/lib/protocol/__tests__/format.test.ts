import { BlockType, identifyBlockType } from '@/lib/protocol/shared';
import {
    packKeyShare,
    unpackKeyShare,
    Algorithm,
    KEY_SHARE_VERSION,
} from '@/lib/protocol/keyShare';
import {
    packEncryptedPayload,
    unpackEncryptedPayload,
    splitEncryptedPayloads,
    ENCRYPTED_PAYLOAD_VERSION,
} from '@/lib/protocol/encryptedPayload';
import { arraysEqual, randomBytes, toHex } from '@/lib/__tests__/testUtils';

describe('protocol format', () => {
    describe('Key share block packing and unpacking', () => {
        it('should pack and unpack a key share block', () => {
            const id = '550e8400-e29b-41d4-a716-446655440000';
            const threshold = 2;
            const totalShares = 3;
            const shareIndex = 0;
            const keyShare = randomBytes(32);
            const iv = randomBytes(12);

            const packed = packKeyShare(id, threshold, totalShares, shareIndex, keyShare, iv);
            const unpacked = unpackKeyShare(packed);

            expect(unpacked.version).toBe(KEY_SHARE_VERSION);
            expect(unpacked.id).toBe(id);
            expect(unpacked.type).toBe(BlockType.KeyShare);
            expect(unpacked.threshold).toBe(threshold);
            expect(unpacked.totalShares).toBe(totalShares);
            expect(unpacked.shareIndex).toBe(shareIndex);
            expect(unpacked.algorithm).toBe(Algorithm.AES_GCM_256);
            expect(arraysEqual(unpacked.iv as Uint8Array, iv)).toBe(true);
            expect(arraysEqual(unpacked.keyShare as Uint8Array, keyShare)).toBe(true);
        });

        it('should handle different share indices', () => {
            const id = crypto.randomUUID();
            const keyShare = randomBytes(32);
            const iv = randomBytes(12);

            for (let i = 0; i < 5; i++) {
                const packed = packKeyShare(id, 3, 5, i, keyShare, iv);
                const unpacked = unpackKeyShare(packed);
                expect(unpacked.shareIndex).toBe(i);
            }
        });

        it('should throw error for invalid IV length', () => {
            const id = crypto.randomUUID();
            const keyShare = randomBytes(32);
            const invalidIv = randomBytes(16); // Should be 12 for AES-GCM

            expect(() => packKeyShare(id, 2, 3, 0, keyShare, invalidIv)).toThrow('IV must be 12 bytes');
        });

        it('should throw error for invalid magic bytes', () => {
            const buffer = randomBytes(100);
            expect(() => unpackKeyShare(buffer)).toThrow('Invalid key share magic bytes');
        });

        it('should throw error for unsupported version', () => {
            const id = crypto.randomUUID();
            const keyShare = randomBytes(32);
            const iv = randomBytes(12);

            const packed = packKeyShare(id, 2, 3, 0, keyShare, iv);

            // Corrupt the version byte (it's after 3 magic bytes)
            packed[3] = 0xFF;

            expect(() => unpackKeyShare(packed)).toThrow('Unsupported key share version');
        });

        it('should throw error for wrong block type', () => {
            const id = crypto.randomUUID();
            const keyShare = randomBytes(32);
            const iv = randomBytes(12);

            const packed = packKeyShare(id, 2, 3, 0, keyShare, iv);

            // Corrupt the block type (after magic + version + 16-byte ID)
            packed[3 + 1 + 16] = BlockType.EncryptedPayload;

            expect(() => unpackKeyShare(packed)).toThrow('Invalid block type for key share');
        });

        it('should reject overly large shares', () => {
            const id = crypto.randomUUID();
            const largeKeyShare = randomBytes(20 * 1024); // 20KB, over the 16KB limit
            const iv = randomBytes(12);

            const packed = packKeyShare(id, 2, 3, 0, largeKeyShare, iv);

            expect(() => unpackKeyShare(packed)).toThrow('Key share too large');
        });
    });

    describe('Encrypted payload block packing and unpacking', () => {
        it('should pack and unpack a encrypted payload block', () => {
            const id = '550e8400-e29b-41d4-a716-446655440000';
            const chunkIndex = 0;
            const totalChunks = 1;
            const ciphertext = randomBytes(100);

            const packed = packEncryptedPayload(id, chunkIndex, totalChunks, ciphertext);
            const unpacked = unpackEncryptedPayload(packed);

            expect(unpacked.version).toBe(ENCRYPTED_PAYLOAD_VERSION);
            expect(unpacked.id).toBe(id);
            expect(unpacked.type).toBe(BlockType.EncryptedPayload);
            expect(unpacked.chunkIndex).toBe(chunkIndex);
            expect(unpacked.totalChunks).toBe(totalChunks);
            expect(arraysEqual(unpacked.ciphertext as Uint8Array, ciphertext)).toBe(true);
        });

        it('should handle multiple chunks', () => {
            const id = crypto.randomUUID();
            const totalChunks = 5;
            const ciphertext = randomBytes(200);

            for (let i = 0; i < totalChunks; i++) {
                const packed = packEncryptedPayload(id, i, totalChunks, ciphertext);
                const unpacked = unpackEncryptedPayload(packed);

                expect(unpacked.chunkIndex).toBe(i);
                expect(unpacked.totalChunks).toBe(totalChunks);
            }
        });

        it('should throw error for invalid magic bytes', () => {
            const buffer = randomBytes(100);
            expect(() => unpackEncryptedPayload(buffer)).toThrow('Invalid encrypted payload magic bytes');
        });

        it('should throw error for unsupported version', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(50);

            const packed = packEncryptedPayload(id, 0, 1, ciphertext);

            // Corrupt the version byte
            packed[3] = 0xFF;

            expect(() => unpackEncryptedPayload(packed)).toThrow('Unsupported encrypted payload version');
        });

        it('should throw error for wrong block type', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(50);

            const packed = packEncryptedPayload(id, 0, 1, ciphertext);

            // Corrupt the block type
            packed[3 + 1 + 16] = BlockType.KeyShare;

            expect(() => unpackEncryptedPayload(packed)).toThrow('Invalid block type for encrypted payload');
        });
    });

    describe('splitEncryptedPayloads', () => {
        it('should split data into single chunk when small enough', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(100);
            const maxChunkSize = 200;

            const chunks = splitEncryptedPayloads(id, ciphertext, maxChunkSize);

            expect(chunks.length).toBe(1);

            const unpacked = unpackEncryptedPayload(chunks[0]);
            expect(unpacked.id).toBe(id);
            expect(unpacked.chunkIndex).toBe(0);
            expect(unpacked.totalChunks).toBe(1);
            expect(arraysEqual(unpacked.ciphertext as Uint8Array, ciphertext)).toBe(true);
        });

        it('should split data into multiple chunks when needed', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(500);
            const maxChunkSize = 100;

            const chunks = splitEncryptedPayloads(id, ciphertext, maxChunkSize);

            expect(chunks.length).toBe(5); // 500 / 100 = 5 chunks

            // Verify each chunk
            for (let i = 0; i < chunks.length; i++) {
                const unpacked = unpackEncryptedPayload(chunks[i]);
                expect(unpacked.id).toBe(id);
                expect(unpacked.chunkIndex).toBe(i);
                expect(unpacked.totalChunks).toBe(5);
            }

            // Reconstruct the original ciphertext
            const reconstructed = new Uint8Array(ciphertext.length);
            let offset = 0;
            for (const chunk of chunks) {
                const unpacked = unpackEncryptedPayload(chunk);
                reconstructed.set(unpacked.ciphertext as Uint8Array, offset);
                offset += unpacked.ciphertext.length;
            }

            expect(arraysEqual(reconstructed, ciphertext)).toBe(true);
        });

        it('should handle partial last chunk', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(250); // 2.5 chunks at 100 bytes each
            const maxChunkSize = 100;

            const chunks = splitEncryptedPayloads(id, ciphertext, maxChunkSize);

            expect(chunks.length).toBe(3);

            const lastChunk = unpackEncryptedPayload(chunks[2]);
            expect(lastChunk.ciphertext.length).toBe(50); // 250 - (100 * 2) = 50
        });

        it('should skip chunk creation when exceeding provided max chunk limit', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(1000);
            const maxChunkSize = 90; // Would require 12 chunks, exceeds the provided limit of 9

            const chunks = splitEncryptedPayloads(id, ciphertext, maxChunkSize, 9);

            expect(chunks.length).toBe(0);
        });

        it('should respect custom max chunk limit', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(900);
            const maxChunkSize = 100; // Exactly 9 chunks (at the provided limit)

            const chunks = splitEncryptedPayloads(id, ciphertext, maxChunkSize, 9);

            expect(chunks.length).toBe(9);
        });
    });

    describe('identifyBlockType', () => {
        it('should identify key share block type', () => {
            const id = crypto.randomUUID();
            const keyShare = randomBytes(32);
            const iv = randomBytes(12);

            const packed = packKeyShare(id, 2, 3, 0, keyShare, iv);
            const blockType = identifyBlockType(packed);

            expect(blockType).toBe(BlockType.KeyShare);
        });

        it('should identify encrypted payload block type', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(100);

            const packed = packEncryptedPayload(id, 0, 1, ciphertext);
            const blockType = identifyBlockType(packed);

            expect(blockType).toBe(BlockType.EncryptedPayload);
        });

        it('should throw error for buffer too small', () => {
            const smallBuffer = randomBytes(10); // Too small to contain headers

            expect(() => identifyBlockType(smallBuffer)).toThrow('Buffer too small to identify block type');
        });

        it('should throw error for invalid magic bytes', () => {
            const buffer = randomBytes(100);

            expect(() => identifyBlockType(buffer)).toThrow('Invalid magic bytes');
        });

        it('should throw error for unsupported version', () => {
            const id = crypto.randomUUID();
            const ciphertext = randomBytes(50);

            const packed = packEncryptedPayload(id, 0, 1, ciphertext);
            packed[3] = 0xFF; // Corrupt version

            expect(() => identifyBlockType(packed)).toThrow('Unsupported version');
        });
    });

    describe('UUID helpers', () => {
        it('should maintain UUID format through pack/unpack cycle', () => {
            const testUuids = [
                '00000000-0000-0000-0000-000000000000',
                '550e8400-e29b-41d4-a716-446655440000',
                'ffffffff-ffff-ffff-ffff-ffffffffffff',
                crypto.randomUUID(),
            ];

            for (const uuid of testUuids) {
                const keyShare = randomBytes(32);
                const iv = randomBytes(12);

                const packed = packKeyShare(uuid, 2, 3, 0, keyShare, iv);
                const unpacked = unpackKeyShare(packed);

                expect(unpacked.id).toBe(uuid);
            }
        });
    });
});
