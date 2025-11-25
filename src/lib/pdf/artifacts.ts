import { packShare, packData, splitData, Algorithm } from '@/lib/protocol/format';
import { generatePdf } from './generator';
import type { EncryptJobResult, SecretSharesData } from '../encryption/types';

const MAX_QR_BYTES = 2100;
const QR_OVERHEAD_BYTES = 50;
const MAX_CHUNK_PAYLOAD = MAX_QR_BYTES - QR_OVERHEAD_BYTES;

export interface GenerateArtifactsOptions {
    shares: number;
    threshold: number;
    title: string;
    dataFileName: string;
}

export async function generateShareArtifacts(
    secretData: SecretSharesData,
    options: GenerateArtifactsOptions
): Promise<EncryptJobResult> {
    const { keyShares, ciphertext, iv, id } = secretData;

    let dataBlocks: Uint8Array[] = [];
    try {
        dataBlocks = splitData(id, ciphertext, MAX_CHUNK_PAYLOAD);
    } catch (err) {
        console.warn('Data too large for QR splitting, skipping embedded ciphertext.', err);
        dataBlocks = [];
    }

    const pdfs: EncryptJobResult['pdfs'] = [];
    for (let i = 0; i < keyShares.length; i++) {
        const shareBlock = packShare(id, options.threshold, options.shares, i + 1, keyShares[i], iv);
        const pdfBlob = await generatePdf(shareBlock, dataBlocks, i + 1, options.shares, options.threshold, options.title);
        const pdfBuffer = await pdfBlob.arrayBuffer();
        pdfs.push({
            name: `share - ${i + 1} -of - ${options.shares}.pdf`,
            data: new Uint8Array(pdfBuffer),
        });
    }

    const fullDataBlock = packData(id, 0, 1, ciphertext);

    return {
        pdfs,
        dataFile: {
            name: options.dataFileName,
            data: fullDataBlock,
        },
    };
}


