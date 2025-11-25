import { jsPDF } from 'jspdf';
// @ts-ignore - Importing from hidden directory in node_modules
import { GEIST_FONTS_COMPRESSED } from '../../../node_modules/.fonts';
import { ungzip } from 'pako';

// Efficiently convert a Uint8Array to base64 without exceeding the call stack
function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid large argument lists
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
}

/**
 * Helper function to decompress font data
 */
function decompressFont(compressedBase64: string): string {
    try {
        // Convert base64 back to Uint8Array
        const compressedData = Uint8Array.from(atob(compressedBase64), c => c.charCodeAt(0));

        // Decompress using pako
        const decompressedData = ungzip(compressedData);

        // Convert back to base64 for jsPDF (chunked to avoid stack overflows in Chrome)
        return uint8ToBase64(decompressedData);
    } catch (error) {
        console.error('Failed to decompress font:', error);
        throw error;
    }
}

/**
 * Loads Geist fonts into jsPDF
 * This should be called for each jsPDF instance before generating any PDF
 */
export function loadGeistFonts(pdf: jsPDF): void {
    // Check if Geist fonts are already loaded in this instance
    const fontList = pdf.getFontList();
    if (
        fontList.Geist &&
        fontList.Geist.includes('normal') &&
        fontList.Geist.includes('bold') &&
        fontList.GeistMono &&
        fontList.GeistMono.includes('normal')
    ) {
        return; // Fonts already loaded
    }

    try {
        // Decompress and add the Geist font variants we use
        const geistRegular = decompressFont(GEIST_FONTS_COMPRESSED.regular);
        pdf.addFileToVFS('Geist-Regular.ttf', geistRegular);
        pdf.addFont('Geist-Regular.ttf', 'Geist', 'normal');

        const geistBold = decompressFont(GEIST_FONTS_COMPRESSED.bold);
        pdf.addFileToVFS('Geist-Bold.ttf', geistBold);
        pdf.addFont('Geist-Bold.ttf', 'Geist', 'bold');

        const geistMonoRegular = decompressFont(GEIST_FONTS_COMPRESSED.monoRegular);
        pdf.addFileToVFS('GeistMono-Regular.ttf', geistMonoRegular);
        pdf.addFont('GeistMono-Regular.ttf', 'GeistMono', 'normal');

    } catch (error) {
        console.error('Failed to load Geist fonts:', error);
        throw error;
    }
}
