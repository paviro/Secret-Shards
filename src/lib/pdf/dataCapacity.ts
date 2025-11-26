import { DataArchive, packDataArchive } from '@/lib/protocol/dataArchive';

// Constants from artifacts.ts
const MAX_QR_BYTES = 2100;
const QR_OVERHEAD_BYTES = 50;
const MAX_CHUNK_PAYLOAD = MAX_QR_BYTES - QR_OVERHEAD_BYTES;

/**
 * Calculate the maximum data capacity in bytes based on max pages setting.
 * maxPages includes 1 share page + N data pages, so data capacity = (maxPages - 1) * chunk size
 */
export function calculateMaxDataCapacity(maxPages: number): number {
    const dataPages = Math.max(0, maxPages - 1); // Subtract 1 for the share page
    return dataPages * MAX_CHUNK_PAYLOAD;
}

/**
 * Calculate the packed (and potentially compressed) size of a data archive.
 * This is used to estimate if the encrypted payload will fit within PDF capacity.
 * The actual encrypted size will be slightly larger due to AES-GCM overhead (16 bytes for auth tag).
 */
export async function calculateDataArchiveSize(
    text: string,
    files: File[]
): Promise<number> {
    try {
        let dataArchive: DataArchive;

        if (files.length > 0 && text) {
            const fileItems = await Promise.all(files.map(async (f) => ({
                name: f.name,
                type: f.type,
                content: new Uint8Array(await f.arrayBuffer())
            })));
            dataArchive = { type: 'mixed', text, files: fileItems };
        } else if (files.length > 0) {
            const fileItems = await Promise.all(files.map(async (f) => ({
                name: f.name,
                type: f.type,
                content: new Uint8Array(await f.arrayBuffer())
            })));
            dataArchive = { type: 'files', files: fileItems };
        } else {
            dataArchive = { type: 'text', content: text };
        }

        const packed = await packDataArchive(dataArchive);
        return packed.byteLength;
    } catch (error) {
        console.error('Error calculating data archive size:', error);
        return 0;
    }
}

/**
 * Check if the data can be embedded in the PDF with the given max pages setting.
 * Accounts for encryption overhead (approximately 16 bytes for GCM tag).
 */
export function canEmbedInPdf(dataSize: number, maxPages: number): boolean {
    const ENCRYPTION_OVERHEAD = 16; // AES-GCM authentication tag
    const encryptedSize = dataSize + ENCRYPTION_OVERHEAD;
    const maxCapacity = calculateMaxDataCapacity(maxPages);
    return encryptedSize <= maxCapacity;
}

