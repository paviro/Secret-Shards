import type { Payload } from '@/lib/protocol/payload';
import type { Algorithm } from '@/lib/protocol/format';

export interface EncryptJobInput {
    payload: Payload;
    shares: number;
    threshold: number;
    title: string;
    dataFileName: string;
}

export interface EncryptJobResult {
    pdfs: { name: string; data: Uint8Array }[];
    dataFile: { name: string; data: Uint8Array };
}

export interface RecoverPayloadInput {
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


