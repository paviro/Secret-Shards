import type { DataArchive } from '@/lib/protocol/dataArchive';
import type { Algorithm } from '@/lib/protocol/keyShare';

export interface EncryptJobInput {
    dataArchive: DataArchive;
    keyShares: number;
    threshold: number;
    title: string;
    dataFileName: string;
}

export interface EncryptJobResult {
    pdfs: { name: string; data: Uint8Array }[];
    dataFile: { name: string; data: Uint8Array };
    qrImages: { name: string; data: Uint8Array | string }[];
}

export interface RecoverDataArchiveInput {
    keyShares: Uint8Array[];
    chunks: Uint8Array[];
    iv: Uint8Array;
    algorithm: Algorithm;
}

export interface SecretSharesData {
    keyShares: Uint8Array[];
    ciphertext: Uint8Array;
    iv: Uint8Array;
    id: string;
}



