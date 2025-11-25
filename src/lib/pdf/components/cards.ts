import { jsPDF } from 'jspdf';
import { COLORS } from '../draw';

/**
 * Draws a stats card with two sections (left and right)
 */
export function drawStatsCard(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    leftLabel: string,
    leftValue: string,
    rightLabel: string,
    rightValue: string,
    accentColor: string = COLORS.accent
): void {
    // Card Container
    doc.setFillColor(COLORS.bg.white);
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    // Vertical Divider Line
    const splitX = x + width * 0.585;
    doc.setDrawColor(COLORS.border);
    doc.line(splitX, y + 3, splitX, y + height - 3);

    // --- Left Side ---
    const leftCenter = x + width * 0.585 / 2;

    // Label
    doc.setTextColor(COLORS.text.light);
    doc.setFontSize(7);
    doc.setFont('Geist', 'bold');
    doc.text(leftLabel, leftCenter, y + 6, { align: 'center' });

    // Value: "X / Y" or single value styling
    const parts = leftValue.split(' / ');
    if (parts.length === 2) {
        doc.setTextColor(accentColor);
        doc.setFontSize(16);
        doc.text(parts[0], leftCenter - 4, y + 14, { align: 'right' });

        doc.setTextColor(COLORS.text.light);
        doc.setFontSize(16);
        doc.setFont('Geist', 'normal');
        doc.text('/', leftCenter, y + 14, { align: 'center' });

        doc.setTextColor(COLORS.text.main);
        doc.setFontSize(16);
        doc.setFont('Geist', 'bold');
        doc.text(parts[1], leftCenter + 4, y + 14, { align: 'left' });
    } else {
        doc.setTextColor(COLORS.text.main);
        doc.setFontSize(16);
        doc.setFont('Geist', 'bold');
        doc.text(leftValue, leftCenter, y + 14, { align: 'center' });
    }

    // --- Right Side ---
    const rightCenter = splitX + (width - width * 0.585) / 2;

    // Label
    doc.setTextColor(COLORS.text.light);
    doc.setFontSize(7);
    doc.setFont('Geist', 'bold');
    doc.text(rightLabel, rightCenter, y + 6, { align: 'center' });

    // Value
    doc.setTextColor(COLORS.text.main);
    doc.setFontSize(16);
    doc.text(rightValue, rightCenter, y + 14, { align: 'center' });
}

/**
 * Draws a simple single-section card
 */
export function drawSimpleCard(
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
    accentColor: string = COLORS.accent
): void {
    // Card Container
    doc.setFillColor(COLORS.bg.white);
    doc.setDrawColor(COLORS.border);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    const center = x + width / 2;

    // Label
    doc.setTextColor(COLORS.text.light);
    doc.setFontSize(7);
    doc.setFont('Geist', 'bold');
    doc.text(label, center, y + 6, { align: 'center' });

    // Value: "X / Y" styling
    const parts = value.split(' / ');
    if (parts.length === 2) {
        doc.setTextColor(accentColor);
        doc.setFontSize(16);
        doc.text(parts[0], center - 4, y + 14, { align: 'right' });

        doc.setTextColor(COLORS.text.light);
        doc.setFontSize(16);
        doc.setFont('Geist', 'normal');
        doc.text('/', center, y + 14, { align: 'center' });

        doc.setTextColor(COLORS.text.main);
        doc.setFontSize(16);
        doc.setFont('Geist', 'bold');
        doc.text(parts[1], center + 4, y + 14, { align: 'left' });
    } else {
        doc.setTextColor(COLORS.text.main);
        doc.setFontSize(16);
        doc.setFont('Geist', 'bold');
        doc.text(value, center, y + 14, { align: 'center' });
    }
}
