import { jsPDF } from 'jspdf';
import { COLORS } from '../draw';

/**
 * Draws the footer on each page with branding and pagination
 */
export function drawFooter(
    doc: jsPDF,
    width: number,
    height: number,
    margin: number,
    pageNum: number,
    totalPages: number
): void {
    const footerH = 10;
    const footerY = height - footerH;

    doc.setFillColor(COLORS.bg.light);
    doc.setDrawColor(COLORS.border);
    doc.rect(0, footerY, width, footerH, 'F');
    doc.line(0, footerY, width, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.text.light);

    // Center text vertically in footer (baseline positioning)
    const fontSize = 8; // in points
    const textY = footerY + (footerH / 2) + (fontSize * 0.35 / 2.83); // Convert pt to mm and adjust for baseline

    // Left: Branding with clickable links
    const prefixText = 'Decrypt on ';
    const websiteText = 'secret-shards.paviro.de';
    const separator = ' · ';
    const githubText = 'github.com/paviro/secret-shards';

    // Calculate positions
    let linkX = margin;

    // Prefix (not clickable)
    doc.text(prefixText, linkX, textY);
    linkX += doc.getTextWidth(prefixText);

    // Website link
    doc.textWithLink(websiteText, linkX, textY, { url: 'https://secret-shards.paviro.de' });
    linkX += doc.getTextWidth(websiteText);

    // Separator (not clickable)
    doc.text(separator, linkX, textY);
    linkX += doc.getTextWidth(separator);

    // GitHub link
    doc.textWithLink(githubText, linkX, textY, { url: 'https://github.com/paviro/secret-shards' });

    // Right: Pagination
    doc.text(`Page ${pageNum} of ${totalPages}`, width - margin, textY, { align: 'right' });
}
