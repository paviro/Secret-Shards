import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// --- Colors & Styles ---
export const COLORS = {
    primary: '#0f172a',   // Slate 900
    secondary: '#334155', // Slate 700
    accent: '#6366f1',    // Indigo 500
    text: {
        main: '#1e293b',  // Slate 800
        light: '#64748b', // Slate 500
        inverse: '#ffffff'
    },
    bg: {
        light: '#f8fafc', // Slate 50
        code: '#f1f5f9',  // Slate 100
        white: '#ffffff'
    },
    border: '#e2e8f0'     // Slate 200
};

export function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    if (typeof globalThis.btoa === 'function') {
        return globalThis.btoa(binary);
    }

    const bufferCtor = (globalThis as typeof globalThis & { Buffer?: typeof Buffer }).Buffer;
    if (bufferCtor) {
        return bufferCtor.from(bytes).toString('base64');
    }

    throw new Error('No base64 encoder available in this environment.');
}

export function drawVectorQr(doc: jsPDF, text: string, x: number, y: number, size: number, color: string = '#000000', errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'M') {
    const qr = QRCode.create(text, { errorCorrectionLevel });
    const modules = qr.modules;
    const moduleCount = modules.size;
    const moduleSize = size / moduleCount;

    doc.setFillColor(color);
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (modules.data[r * moduleCount + c]) {
                // Draw a slight overlap to avoid hairline gaps
                doc.rect(x + c * moduleSize, y + r * moduleSize, moduleSize + 0.05, moduleSize + 0.05, 'F');
            }
        }
    }
}

export function drawCodeBlock(
    doc: jsPDF,
    lines: string[],
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    options: { fontSize?: number; lineHeight?: number } = {}
) {
    const fontSize = options.fontSize || 8;
    const lineHeight = options.lineHeight || 4;

    doc.setFillColor(COLORS.bg.code);
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Title
    doc.setFont('Geist', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.accent);
    doc.text(title, x + 5, y + 7);

    // Content
    doc.setFont('GeistMono', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(COLORS.text.main);

    let lineY = y + 13;
    lines.forEach(line => {
        doc.text(line, x + 5, lineY);
        lineY += lineHeight;
    });
}
