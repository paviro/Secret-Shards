import { jsPDF } from 'jspdf';
import { COLORS, arrayBufferToBase64, drawVectorQr, drawCodeBlock } from './draw';
import { drawFooter, drawHeader, drawStatsCard, drawSimpleCard } from './components';
import { loadGeistFonts } from './fontLoader';

export async function generatePdf(
    shareBlock: Uint8Array,
    dataBlocks: Uint8Array[],
    shareIndex: number,
    totalShares: number,
    threshold: number,
    title: string
): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    loadGeistFonts(doc);

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = width - (margin * 2);
    const binaryBlockHeight = 91;

    let y = margin;

    // --- Page 1: Share Card & Info ---

    // 1. Header Area with Share Info Card
    drawHeader(
        doc,
        width,
        margin,
        title || 'Secret Key Share',
        'A piece of the encryption key for safe keeping',
        {
            type: 'stats',
            width: 65,
            height: 18,
            leftLabel: 'SHARE INDEX',
            leftValue: `${shareIndex} / ${totalShares}`,
            rightLabel: 'REQUIRED',
            rightValue: String(threshold)
        }
    );

    // --- Calculate Content Height & Center ---
    let contentHeight = 0;

    // 3. What is this?
    contentHeight += 7; // Title

    doc.setFont('Geist', 'normal');
    doc.setFontSize(10);

    const paragraphs = dataBlocks.length > 0 ? [
        `This document contains both a cryptographic share of a secret key and an encrypted data archive.`,
        `Individually, a share reveals nothing about the secret. To recover the original secret and decrypt the data, you must combine this share with at least ${threshold - 1} other distinct shares.`,
        `This ensures security even if some shares are lost or stolen, provided fewer than ${threshold} shares are compromised. Keep this document safe and secure.`
    ] : [
        `This document contains a cryptographic share of a secret key generated using Shamir's Secret Sharing.`,
        `Individually, a share reveals nothing about the secret. To recover the original secret, you must combine this share with at least ${threshold - 1} other distinct shares.`,
        `This ensures security even if some shares are lost or stolen, provided fewer than ${threshold} shares are compromised. Keep this document safe and secure.`
    ];

    paragraphs.forEach(paragraph => {
        const splitText = doc.splitTextToSize(paragraph, contentWidth);
        contentHeight += splitText.length * 5 + 1.5;
    });

    contentHeight += 10; // Separator 1 (line height + margin)

    // 4. Encryption Details
    contentHeight += 7; // Title
    contentHeight += 2 * 5; // 2 lines
    contentHeight += 4; // Padding

    // 5. Binary Spec
    contentHeight += 7; // Title
    contentHeight += 6; // Subtitle
    contentHeight += binaryBlockHeight; // Block Height
    contentHeight += 5; // Padding after

    contentHeight += 5; // Separator 2
    contentHeight += 60; // Share QR Code Section

    // Calculate startY to center content
    const headerHeight = 30;
    const footerHeight = 10;
    const availableHeight = height - headerHeight - footerHeight;

    y = headerHeight + (availableHeight - contentHeight) / 2 + 3;

    // 3. What is this?
    doc.setTextColor(COLORS.text.main);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(12);
    doc.text('What is this?', margin, y);
    y += 7;

    doc.setFont('Geist', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text.main);

    paragraphs.forEach(paragraph => {
        const splitText = doc.splitTextToSize(paragraph, contentWidth);
        doc.text(splitText, margin, y);
        y += splitText.length * 5 + 1.5;
    });

    // Separator 1
    doc.setDrawColor(COLORS.border);
    doc.line(0, y, width, y);
    y += 10;

    // 4. Encryption Details
    doc.setTextColor(COLORS.text.main);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(12);
    doc.text('Encryption Details', margin, y);
    y += 7;

    doc.setFont('Geist', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text.main);
    const encDetails = [
        `Algorithm: AES-GCM (256-bit) • Secret Sharing: Shamir's Secret Sharing (gf(2^8))`,
        `Key Derivation: None (Random 256-bit Master Key split directly)`
    ];
    encDetails.forEach(line => {
        doc.text(line, margin, y);
        y += 5;
    });
    y += 4;

    // 5. Binary Format Spec (Side-by-Side)
    doc.setTextColor(COLORS.text.main);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(12);
    doc.text('Binary Specification', margin, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont('Geist', 'normal');
    doc.setTextColor(COLORS.text.main);
    doc.text('Share/data QR blocks and the decrypted archive follow these layouts:', margin, y);
    y += 6;

    const colGap = 4;
    const col1Width = (contentWidth - colGap) * 0.38;
    const col2Width = contentWidth - col1Width - colGap;
    const blockHeight = binaryBlockHeight;

    const compactOpts = { fontSize: 7, lineHeight: 3.2 };

    const leftTopH = 48;
    const leftBottomH = 36;
    const rightTopH = 48;
    const rightBottomH = 36;

    // Share Block Spec (Top Left)
    const shareSpec = [
        'Offset | Field',
        '------------------',
        '0x00   | Magic "SHD"',
        '0x03   | Ver = 0x01',
        '0x04   | ID (16b UUID)',
        '0x14   | Type = 0x01 (Share)',
        '0x15   | Threshold (1b)',
        '0x16   | Total (1b)',
        '0x17   | Index (1b)',
        '0x18   | EncAlg (1b) | IV (12b)',
        '0x25   | Key Share (var)'
    ];
    drawCodeBlock(doc, shareSpec, margin, y, col1Width, leftTopH, 'Key Share (0x01)', compactOpts);

    // Data Block Spec (Bottom Left)
    const dataSpec = [
        '0x00   | Magic "SHD"',
        '0x03   | Ver = 0x01',
        '0x04   | ID (16b UUID)',
        '0x14   | Type = 0x02 (Encrypted Chunk)',
        '0x15   | Total Chunks (1b)',
        '0x16   | Chunk Index (1b)',
        '0x17   | Encrypted Data Archive',
    ];
    drawCodeBlock(doc, dataSpec, margin, y + leftTopH + colGap, col1Width, leftBottomH, 'Encrypted Payload (0x02)', compactOpts);

    // Data archive Spec (Top Right)
    const archiveSpec = [
        '0x00   | Version = 0x01',
        '0x01   | Compression (0x00=None, 0x01=GZip)',
        '0x02   | Body (gzip compressed if Compression=0x01)',
        '       |   Type (1b) - first byte of decompressed body:',
        '       |     0x01 Text  -> UTF-8 bytes',
        '       |     0x02 Files -> Count (1b)',
        '       |                   File entries',
        '       |     0x03 Mixed -> TextLen (4b LE)',
        '       |                   Text (UTF-8 bytes)',
        '       |                   FileCount (1b)',
        '       |                   File entries'
    ];
    drawCodeBlock(doc, archiveSpec, margin + col1Width + colGap, y, col2Width, rightTopH, 'Decrypted Data Archive', compactOpts);

    // File Entry Spec (Bottom Right)
    const entrySpec = [
        '0x00   | Name Length (2b LE)',
        '0x02   | Name (UTF-8 bytes)',
        'var    | Type Length (1b)',
        'var    | MIME Type (UTF-8 bytes)',
        'var    | Content Length (4b LE)',
        'var    | Content Data (bytes)'
    ];
    drawCodeBlock(doc, entrySpec, margin + col1Width + colGap, y + rightTopH + colGap, col2Width, rightBottomH, 'File Entry Structure in Decrypted Data Archive', compactOpts);

    y += blockHeight + 2;

    // Separator 2
    doc.setDrawColor(COLORS.border);
    doc.line(0, y, width, y);
    y += 5;

    // 5. Share QR Code Section
    const shareBase64 = arrayBufferToBase64(shareBlock);
    const bottomSectionHeight = 60;

    const finalSectionY = y;

    // Draw Section Container
    doc.setFillColor(COLORS.bg.white);
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(margin, finalSectionY, contentWidth, bottomSectionHeight, 3, 3, 'FD');

    // QR Code (Left side)
    const qrSize = 50;
    const qrX = margin + 10;
    const qrY = finalSectionY + (bottomSectionHeight - qrSize) / 2;

    drawVectorQr(doc, shareBase64, qrX, qrY, qrSize, COLORS.primary);

    // Divider line
    doc.setDrawColor(COLORS.border);
    doc.line(qrX + qrSize + 10, finalSectionY + 10, qrX + qrSize + 10, finalSectionY + bottomSectionHeight - 10);

    // Right side details
    const infoX = qrX + qrSize + 20;
    let infoY = finalSectionY + 15;

    doc.setFont('Geist', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(COLORS.text.main);
    doc.text('ACCESS KEY SHARE', infoX, infoY);

    infoY += 9;
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text.main);
    doc.text(`Share Index: ${shareIndex} of ${totalShares}`, infoX, infoY);

    infoY += 5.5;
    doc.text(`Threshold: ${threshold} shares needed`, infoX, infoY);

    infoY += 8;
    doc.setFontSize(9);
    doc.setFont('Geist', 'bold');
    doc.setTextColor(COLORS.text.main);
    doc.text('MANUAL ENTRY STRING', infoX, infoY);

    infoY += 5.5;
    doc.setFont('GeistMono', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text.main);

    // Split base64 string
    const charPerLine = 35;
    for (let i = 0; i < shareBase64.length; i += charPerLine) {
        doc.text(shareBase64.substring(i, i + charPerLine), infoX, infoY);
        infoY += 4;
    }

    // Footer (Full Width)
    const footerH = 10;
    const totalPdfPages = 1 + dataBlocks.length;
    drawFooter(doc, width, height, margin, 1, totalPdfPages);


    // --- Page 2+: Encrypted Data Chunks ---
    for (let i = 0; i < dataBlocks.length; i++) {
        const dataBlock = dataBlocks[i];
        doc.addPage();
        const dataBase64 = arrayBufferToBase64(dataBlock);
        const pageNum = i + 2;

        // 1. Header with Part Info Card
        drawHeader(
            doc,
            width,
            margin,
            'Encrypted Data DataArchive',
            'The AES-GCM 256-bit encrypted data archive chunk',
            {
                type: 'simple',
                width: 40,
                height: 18,
                label: 'PART',
                value: `${i + 1} / ${dataBlocks.length}`
            }
        );

        // 2. Calculate Layout Heights First
        const headerH = 13;
        const qrPadding = 4;
        const textPaddingY = 6;
        const textPaddingX = qrPadding;

        const qrAvailableW = contentWidth - (qrPadding * 2);

        const dataSizeKB = dataBlock.byteLength / 1024;
        let maxQrSize = 100;

        if (dataSizeKB < 1.0) {
            maxQrSize = 150;
        } else if (dataSizeKB < 1.5) {
            maxQrSize = 120;
        }

        const qrSize = Math.min(qrAvailableW, maxQrSize);
        const qrSectionH = qrSize + (qrPadding * 2);

        // Manual Entry Section (Dynamic Height)
        doc.setFont('GeistMono', 'normal');
        doc.setFontSize(8);
        const textW = contentWidth - (textPaddingX * 2);
        const charW = doc.getTextWidth('A');
        const charsPerLine = Math.floor(textW / charW);
        const lineHeight = 3.5;

        const totalLines = Math.ceil(dataBase64.length / charsPerLine);
        const textContentH = 4 + (totalLines * lineHeight);
        const textSectionH = textPaddingY + textContentH + (textPaddingY - 5);

        const totalCardH = headerH + qrSectionH + textSectionH;

        const headerAreaH = 30;
        const availablePageH = height - headerAreaH - footerH;

        let cardY = headerAreaH + (availablePageH - totalCardH) / 2;
        if (cardY < headerAreaH + 5) cardY = headerAreaH + 5;

        // --- Draw Card ---

        // Main Container
        doc.setFillColor(COLORS.bg.white);
        doc.setDrawColor(COLORS.border);
        doc.roundedRect(margin, cardY, contentWidth, totalCardH, 3, 3, 'FD');

        // Card Header Strip
        doc.setFont('Geist', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text.main);
        doc.text(`QR Code`, margin + textPaddingX, cardY + 8);

        doc.setTextColor(COLORS.text.light);
        const sizeKB = (dataBlock.byteLength / 1024).toFixed(2) + ' KB';
        doc.text(sizeKB, margin + contentWidth - textPaddingX, cardY + 8, { align: 'right' });

        // Horizontal Divider
        doc.setDrawColor(COLORS.border);
        doc.line(margin, cardY + headerH, margin + contentWidth, cardY + headerH);

        // --- QR Code Section ---
        const qrY = cardY + headerH + qrPadding;
        const qrX = margin + qrPadding + (qrAvailableW - qrSize) / 2;

        drawVectorQr(doc, dataBase64, qrX, qrY, qrSize, COLORS.primary, 'L');

        // Divider between QR and Text
        const textSectionY = cardY + headerH + qrSectionH;
        doc.setDrawColor(COLORS.border);
        doc.line(margin, textSectionY, margin + contentWidth, textSectionY);

        // --- Manual Entry Section ---
        let textY = textSectionY + textPaddingY;
        const textX = margin + textPaddingX;

        doc.setFont('Geist', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(COLORS.text.main);
        doc.text('MANUAL ENTRY STRING', textX, textY);
        textY += 4;

        doc.setFont('GeistMono', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.text.light);

        for (let i = 0; i < dataBase64.length; i += charsPerLine) {
            doc.text(dataBase64.substring(i, i + charsPerLine), textX, textY);
            textY += lineHeight;
        }

        // Footer (Full Width)
        drawFooter(doc, width, height, margin, pageNum, totalPdfPages);
    }

    return doc.output('blob');
}

