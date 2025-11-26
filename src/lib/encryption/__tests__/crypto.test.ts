import { encrypt, decrypt, split, combine } from '@/lib/encryption/crypto';
import { arraysEqual, randomBytes } from '@/lib/__tests__/testUtils';

describe('crypto', () => {
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt data successfully', async () => {
            const originalData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

            const { key, ciphertext, iv } = await encrypt(originalData as Uint8Array<ArrayBuffer>);

            // Verify the encrypted data is different from original
            expect(arraysEqual(ciphertext as Uint8Array, originalData)).toBe(false);

            // Verify key is 256 bits (32 bytes)
            expect(key.length).toBe(32);

            // Verify IV is 12 bytes for AES-GCM
            expect(iv.length).toBe(12);

            // Decrypt and verify
            const decrypted = await decrypt(key, ciphertext, iv);
            expect(arraysEqual(decrypted as Uint8Array, originalData)).toBe(true);
        });

        it('should encrypt different data to different ciphertexts', async () => {
            const data1 = new Uint8Array([1, 2, 3, 4, 5]);
            const data2 = new Uint8Array([6, 7, 8, 9, 10]);

            const { ciphertext: cipher1 } = await encrypt(data1 as Uint8Array<ArrayBuffer>);
            const { ciphertext: cipher2 } = await encrypt(data2 as Uint8Array<ArrayBuffer>);

            expect(arraysEqual(cipher1 as Uint8Array, cipher2 as Uint8Array)).toBe(false);
        });

        it('should handle empty data', async () => {
            const emptyData = new Uint8Array([]);

            const { key, ciphertext, iv } = await encrypt(emptyData as Uint8Array<ArrayBuffer>);
            const decrypted = await decrypt(key, ciphertext, iv);

            expect(decrypted.length).toBe(0);
        });

        it('should handle large data', async () => {
            const largeData = randomBytes(10 * 1024 * 1024); // 10MB

            const { key, ciphertext, iv } = await encrypt(largeData as Uint8Array<ArrayBuffer>);
            const decrypted = await decrypt(key, ciphertext, iv);

            expect(arraysEqual(decrypted as Uint8Array, largeData)).toBe(true);
        }, 30000); // 30s timeout for large data test

        it('should fail to decrypt with wrong key', async () => {
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);
            const { ciphertext, iv } = await encrypt(originalData as Uint8Array<ArrayBuffer>);

            // Generate a different key
            const wrongKey = randomBytes(32);

            await expect(decrypt(wrongKey as Uint8Array<ArrayBuffer>, ciphertext, iv)).rejects.toThrow();
        });

        it('should fail to decrypt with wrong IV', async () => {
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);
            const { key, ciphertext } = await encrypt(originalData as Uint8Array<ArrayBuffer>);

            // Generate a different IV
            const wrongIv = randomBytes(12);

            await expect(decrypt(key, ciphertext, wrongIv as Uint8Array<ArrayBuffer>)).rejects.toThrow();
        });
    });

    describe('split and combine (Shamir Secret Sharing)', () => {
        it('should split and combine a key with threshold 2 of 3', async () => {
            const key = randomBytes(32);

            const shares = await split(key as Uint8Array<ArrayBuffer>, 3, 2);

            expect(shares.length).toBe(3);

            // Combine with shares 0 and 1
            const recovered1 = await combine([shares[0], shares[1]]);
            expect(arraysEqual(recovered1 as Uint8Array, key)).toBe(true);

            // Combine with shares 1 and 2
            const recovered2 = await combine([shares[1], shares[2]]);
            expect(arraysEqual(recovered2 as Uint8Array, key)).toBe(true);

            // Combine with shares 0 and 2
            const recovered3 = await combine([shares[0], shares[2]]);
            expect(arraysEqual(recovered3 as Uint8Array, key)).toBe(true);
        });

        it('should split and combine with threshold 3 of 5', async () => {
            const key = randomBytes(32);

            const shares = await split(key as Uint8Array<ArrayBuffer>, 5, 3);

            expect(shares.length).toBe(5);

            // Combine with shares 0, 1, 2
            const recovered = await combine([shares[0], shares[1], shares[2]]);
            expect(arraysEqual(recovered as Uint8Array, key)).toBe(true);
        });

        it('should handle minimum threshold 2 of 2', async () => {
            const key = randomBytes(32);

            const shares = await split(key as Uint8Array<ArrayBuffer>, 2, 2);

            expect(shares.length).toBe(2);

            const recovered = await combine([shares[0], shares[1]]);
            expect(arraysEqual(recovered as Uint8Array, key)).toBe(true);
        });

        it('should fail to combine with insufficient shares', async () => {
            const key = randomBytes(32);

            const shares = await split(key as Uint8Array<ArrayBuffer>, 3, 2);

            // Try to combine with only 1 share (threshold is 2)
            await expect(combine([shares[0]])).rejects.toThrow();
        });

        it('should work with all shares when threshold equals total', async () => {
            const key = randomBytes(32);

            const shares = await split(key as Uint8Array<ArrayBuffer>, 3, 3);

            expect(shares.length).toBe(3);

            // Must use all shares
            const recovered = await combine([shares[0], shares[1], shares[2]]);
            expect(arraysEqual(recovered as Uint8Array, key)).toBe(true);
        });
    });
});
