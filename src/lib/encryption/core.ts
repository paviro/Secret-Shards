import { encrypt, split, combine, decrypt } from '@/lib/encryption/crypto';
import { packDataArchive, unpackDataArchive, type DataArchive } from '@/lib/protocol/dataArchive';
import { Algorithm } from '@/lib/protocol/keyShare';
import type { SecretSharesData, RecoverDataArchiveInput } from './types';

export interface CreateSecretSharesOptions {
    dataArchive: DataArchive;
    shares: number;
    threshold: number;
}

export async function createSecretShares(options: CreateSecretSharesOptions): Promise<SecretSharesData> {
    const dataToEncrypt = await packDataArchive(options.dataArchive);
    const { key, ciphertext, iv } = await encrypt(dataToEncrypt as Uint8Array<ArrayBuffer>);
    const keyShares = await split(key, options.shares, options.threshold);
    const id = crypto.randomUUID();

    return {
        keyShares,
        ciphertext: ciphertext as Uint8Array,
        iv,
        id
    };
}

export async function reconstructSecret(input: RecoverDataArchiveInput): Promise<DataArchive> {
    if (input.algorithm !== Algorithm.AES_GCM_256) {
        throw new Error(`Unsupported algorithm: ${input.algorithm}`);
    }

    const recoveredKey = await combine(input.keyShares as Uint8Array<ArrayBuffer>[]);

    const totalLength = input.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const fullCiphertext = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of input.chunks) {
        fullCiphertext.set(chunk, offset);
        offset += chunk.length;
    }

    const decrypted = await decrypt(recoveredKey, fullCiphertext as Uint8Array<ArrayBuffer>, input.iv as Uint8Array<ArrayBuffer>);
    return unpackDataArchive(decrypted);
}

