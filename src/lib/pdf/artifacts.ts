import { packKeyShare, Algorithm } from '@/lib/protocol/keyShare';
import { packEncryptedPayload, splitEncryptedPayloads } from '@/lib/protocol/encryptedPayload';
import { generatePdf } from './generator';
import type { EncryptJobResult, SecretSharesData } from '../encryption/types';
import QRCode from 'qrcode';
import { arrayBufferToBase64 } from './draw';

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
        dataBlocks = splitEncryptedPayloads(id, ciphertext, MAX_CHUNK_PAYLOAD);
    } catch (err) {
        console.warn('Data too large for QR splitting, skipping embedded ciphertext.', err);
        dataBlocks = [];
    }

    const pdfs: EncryptJobResult['pdfs'] = [];
    const qrImages: EncryptJobResult['qrImages'] = [];

    for (let i = 0; i < keyShares.length; i++) {
        const shareBlock = packKeyShare(id, options.threshold, options.shares, i + 1, keyShares[i], iv);
        const pdfBlob = await generatePdf(shareBlock, dataBlocks, i + 1, options.shares, options.threshold, options.title);
        const pdfBuffer = await pdfBlob.arrayBuffer();
        pdfs.push({
            name: `share - ${i + 1} -of - ${options.shares}.pdf`,
            data: new Uint8Array(pdfBuffer),
        });

        // Generate QR code images for this share
        const shareBase64 = arrayBufferToBase64(shareBlock);
        const shareIndex = i + 1;

        // Generate SVG
        const svgString = await QRCode.toString(shareBase64, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 0,
            color: {
                dark: '#000000',
                light: '#00000000' // Transparent background
            }
        });
        qrImages.push({
            name: `shares/svg/share-${shareIndex}-of-${options.shares}.svg`,
            data: svgString
        });

        // Generate PNG
        const pngDataUrl = await QRCode.toDataURL(shareBase64, {
            errorCorrectionLevel: 'M',
            width: 1500,
            margin: 0,
            color: {
                dark: '#000000',
                light: '#00000000' // Transparent background
            }
        });
        // Convert base64 data URL to Uint8Array
        const base64Data = pngDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const pngBuffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            pngBuffer[i] = binaryString.charCodeAt(i);
        }
        qrImages.push({
            name: `shares/png/share-${shareIndex}-of-${options.shares}.png`,
            data: pngBuffer
        });
    }

    // Generate QR code images for data blocks
    for (let i = 0; i < dataBlocks.length; i++) {
        const dataBlock = dataBlocks[i];
        const dataBase64 = arrayBufferToBase64(dataBlock);
        const dataIndex = i + 1;

        // Generate SVG
        const svgString = await QRCode.toString(dataBase64, {
            type: 'svg',
            errorCorrectionLevel: 'L',
            margin: 0,
            color: {
                dark: '#000000',
                light: '#00000000' // Transparent background
            }
        });
        qrImages.push({
            name: `encrypted_data/svg/data-${dataIndex}-of-${dataBlocks.length}.svg`,
            data: svgString
        });

        // Generate PNG
        const pngDataUrl = await QRCode.toDataURL(dataBase64, {
            errorCorrectionLevel: 'L',
            width: 1500,
            margin: 0,
            color: {
                dark: '#000000',
                light: '#00000000' // Transparent background
            }
        });
        // Convert base64 data URL to Uint8Array
        const base64Data = pngDataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const pngBuffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            pngBuffer[i] = binaryString.charCodeAt(i);
        }
        qrImages.push({
            name: `encrypted_data/png/data-${dataIndex}-of-${dataBlocks.length}.png`,
            data: pngBuffer
        });
    }

    const fullEncryptedPayloadBlock = packEncryptedPayload(id, 0, 1, ciphertext);

    return {
        pdfs,
        dataFile: {
            name: options.dataFileName,
            data: fullEncryptedPayloadBlock,
        },
        qrImages,
    };
}



