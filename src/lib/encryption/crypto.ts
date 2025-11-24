import { split as sssSplit, combine as sssCombine } from 'shamir-secret-sharing';

function getCrypto(): Crypto {
    const cryptoObj = globalThis.crypto;
    if (!cryptoObj) {
        throw new Error('Web Crypto API is not available in this environment.');
    }
    return cryptoObj;
}

export async function encrypt(data: Uint8Array<ArrayBuffer>): Promise<{ key: Uint8Array<ArrayBuffer>; ciphertext: Uint8Array<ArrayBuffer>; iv: Uint8Array<ArrayBuffer> }> {
    const cryptoObj = getCrypto();
    const key = await cryptoObj.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );

    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ciphertextBuffer = await cryptoObj.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        data
    );

    const rawKey = await cryptoObj.subtle.exportKey('raw', key);

    return {
        key: new Uint8Array(rawKey),
        ciphertext: new Uint8Array(ciphertextBuffer),
        iv: iv as Uint8Array<ArrayBuffer>,
    };
}

export async function decrypt(key: Uint8Array<ArrayBuffer>, ciphertext: Uint8Array<ArrayBuffer>, iv: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
    const cryptoObj = getCrypto();
    const cryptoKey = await cryptoObj.subtle.importKey(
        'raw',
        key,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const decryptedBuffer = await cryptoObj.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        cryptoKey,
        ciphertext
    );

    return new Uint8Array(decryptedBuffer);
}

export async function split(key: Uint8Array<ArrayBuffer>, shares: number, threshold: number): Promise<Uint8Array<ArrayBuffer>[]> {
    // The library returns Uint8Array[] directly
    const result = await sssSplit(key, shares, threshold);
    return result as Uint8Array<ArrayBuffer>[];
}

export async function combine(shares: Uint8Array<ArrayBuffer>[]): Promise<Uint8Array<ArrayBuffer>> {
    const result = await sssCombine(shares);
    return result as Uint8Array<ArrayBuffer>;
}
