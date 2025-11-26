import { createSecretShares, reconstructSecret } from '@/lib/encryption/core';
import { Algorithm } from '@/lib/protocol/format';
import { arraysEqual, createTextPayload, createFilesPayload, createTestFile } from '@/lib/__tests__/testUtils';
import type { RecoverPayloadInput } from '@/lib/encryption/types';

describe('encryption core', () => {
    describe('createSecretShares', () => {
        it('should create secret shares for text payload', async () => {
            const payload = createTextPayload('Hello, World!');

            const result = await createSecretShares({
                payload,
                shares: 3,
                threshold: 2,
            });

            expect(result.keyShares.length).toBe(3);
            expect(result.ciphertext).toBeInstanceOf(Uint8Array);
            expect(result.iv).toBeInstanceOf(Uint8Array);
            expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
            expect(result.iv.length).toBe(12); // AES-GCM IV length
        });

        it('should create secret shares for files payload', async () => {
            const payload = createFilesPayload([
                createTestFile('test.txt', 'Test file content'),
                createTestFile('data.json', '{"key": "value"}'),
            ]);

            const result = await createSecretShares({
                payload,
                shares: 5,
                threshold: 3,
            });

            expect(result.keyShares.length).toBe(5);
            expect(result.ciphertext.length).toBeGreaterThan(0);
        });

        it('should generate different ciphertext for same payload', async () => {
            const payload = createTextPayload('Same content');

            const result1 = await createSecretShares({ payload, shares: 2, threshold: 2 });
            const result2 = await createSecretShares({ payload, shares: 2, threshold: 2 });

            // Different IVs should result in different ciphertexts
            expect(arraysEqual(result1.ciphertext, result2.ciphertext)).toBe(false);
            expect(result1.id).not.toBe(result2.id);
        });
    });

    describe('reconstructSecret', () => {
        it('should reconstruct text payload from shares', async () => {
            const originalPayload = createTextPayload('Secret message');

            const { keyShares, ciphertext, iv, id } = await createSecretShares({
                payload: originalPayload,
                shares: 3,
                threshold: 2,
            });

            const input: RecoverPayloadInput = {
                algorithm: Algorithm.AES_GCM_256,
                keyShares: [keyShares[0], keyShares[1]],
                chunks: [ciphertext],
                iv,
            };

            const recovered = await reconstructSecret(input);

            expect(recovered.type).toBe('text');
            if (recovered.type === 'text') {
                expect(recovered.content).toBe('Secret message');
            }
        });

        it('should reconstruct files payload from shares', async () => {
            const originalPayload = createFilesPayload([
                createTestFile('file1.txt', 'Content 1'),
                createTestFile('file2.txt', 'Content 2'),
            ]);

            const { keyShares, ciphertext, iv } = await createSecretShares({
                payload: originalPayload,
                shares: 4,
                threshold: 2,
            });

            const input: RecoverPayloadInput = {
                algorithm: Algorithm.AES_GCM_256,
                keyShares: [keyShares[2], keyShares[3]], // Use different shares
                chunks: [ciphertext],
                iv,
            };

            const recovered = await reconstructSecret(input);

            expect(recovered.type).toBe('files');
            if (recovered.type === 'files') {
                expect(recovered.files.length).toBe(2);
                expect(recovered.files[0].name).toBe('file1.txt');
                expect(recovered.files[1].name).toBe('file2.txt');

                const decoder = new TextDecoder();
                expect(decoder.decode(recovered.files[0].content)).toBe('Content 1');
                expect(decoder.decode(recovered.files[1].content)).toBe('Content 2');
            }
        });

        it('should work with any threshold combination of shares', async () => {
            const originalPayload = createTextPayload('Test with combinations');

            const { keyShares, ciphertext, iv } = await createSecretShares({
                payload: originalPayload,
                shares: 5,
                threshold: 3,
            });

            // Test different combinations
            const combinations = [
                [keyShares[0], keyShares[1], keyShares[2]],
                [keyShares[1], keyShares[3], keyShares[4]],
                [keyShares[0], keyShares[2], keyShares[4]],
            ];

            for (const combo of combinations) {
                const input: RecoverPayloadInput = {
                    algorithm: Algorithm.AES_GCM_256,
                    keyShares: combo,
                    chunks: [ciphertext],
                    iv,
                };

                const recovered = await reconstructSecret(input);
                expect(recovered.type).toBe('text');
                if (recovered.type === 'text') {
                    expect(recovered.content).toBe('Test with combinations');
                }
            }
        });

        it('should handle multiple ciphertext chunks', async () => {
            const originalPayload = createTextPayload('Multi-chunk test');

            const { keyShares, ciphertext, iv } = await createSecretShares({
                payload: originalPayload,
                shares: 2,
                threshold: 2,
            });

            // Split ciphertext into chunks (simulating multi-page QR codes)
            const chunk1 = ciphertext.slice(0, Math.floor(ciphertext.length / 2));
            const chunk2 = ciphertext.slice(Math.floor(ciphertext.length / 2));

            const input: RecoverPayloadInput = {
                algorithm: Algorithm.AES_GCM_256,
                keyShares: keyShares,
                chunks: [chunk1, chunk2],
                iv,
            };

            const recovered = await reconstructSecret(input);

            expect(recovered.type).toBe('text');
            if (recovered.type === 'text') {
                expect(recovered.content).toBe('Multi-chunk test');
            }
        });

        it('should throw error for unsupported algorithm', async () => {
            const input: RecoverPayloadInput = {
                algorithm: 99 as Algorithm, // Invalid algorithm
                keyShares: [],
                chunks: [new Uint8Array()],
                iv: new Uint8Array(12) as Uint8Array<ArrayBuffer>,
            };

            await expect(reconstructSecret(input)).rejects.toThrow('Unsupported algorithm');
        });
    });

    describe('end-to-end encryption flow', () => {
        it('should complete full encrypt-decrypt cycle', async () => {
            const originalPayload = createTextPayload('Complete test');

            // Encrypt
            const encrypted = await createSecretShares({
                payload: originalPayload,
                shares: 3,
                threshold: 2,
            });

            // Decrypt
            const input: RecoverPayloadInput = {
                algorithm: Algorithm.AES_GCM_256,
                keyShares: [encrypted.keyShares[0], encrypted.keyShares[2]],
                chunks: [encrypted.ciphertext],
                iv: encrypted.iv,
            };

            const recovered = await reconstructSecret(input);

            // Verify
            expect(recovered).toEqual(originalPayload);
        });
    });
});
