import { jsPDF } from 'jspdf';
import { COLORS } from '../draw';
import { drawStatsCard, drawSimpleCard } from './cards';

export interface HeaderCardConfig {
    type: 'stats' | 'simple';
    width: number;
    height: number;
    // For stats card
    leftLabel?: string;
    leftValue?: string;
    rightLabel?: string;
    rightValue?: string;
    // For simple card
    label?: string;
    value?: string;
    accentColor?: string;
}

/**
 * Draws the header on pages with title and subtitle, optionally with a card
 */
export function drawHeader(
    doc: jsPDF,
    width: number,
    margin: number,
    title: string,
    subtitle: string,
    cardConfig?: HeaderCardConfig
): void {
    doc.setFillColor(COLORS.bg.light);
    doc.setDrawColor(COLORS.border);
    doc.rect(0, 0, width, 30, 'F');
    doc.line(0, 30, width, 30);

    doc.setTextColor(COLORS.text.main);
    doc.setFont('Geist', 'bold');
    doc.setFontSize(18);
    doc.text(title, margin, 15);

    doc.setFont('Geist', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.text.light);
    doc.text(subtitle, margin, 21);

    // Draw card if provided
    if (cardConfig) {
        const cardX = width - margin - cardConfig.width;
        const cardY = 6;

        if (cardConfig.type === 'stats' && cardConfig.leftLabel && cardConfig.leftValue && cardConfig.rightLabel && cardConfig.rightValue) {
            drawStatsCard(
                doc,
                cardX,
                cardY,
                cardConfig.width,
                cardConfig.height,
                cardConfig.leftLabel,
                cardConfig.leftValue,
                cardConfig.rightLabel,
                cardConfig.rightValue,
                cardConfig.accentColor
            );
        } else if (cardConfig.type === 'simple' && cardConfig.label && cardConfig.value) {
            drawSimpleCard(
                doc,
                cardX,
                cardY,
                cardConfig.width,
                cardConfig.height,
                cardConfig.label,
                cardConfig.value,
                cardConfig.accentColor
            );
        }
    }
}

