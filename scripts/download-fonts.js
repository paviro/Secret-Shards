#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pako = require('pako');

// Google Fonts API URLs for TTF files (these work for jsPDF)
// Only download variants that we actually use in PDF generation
// Key format maps to generated filenames
const FONT_VARIANTS = {
    'geist-regular': { family: 'Geist', weight: '400' },
    'geist-bold': { family: 'Geist', weight: '700' },
    'geist-mono-regular': { family: 'Geist+Mono', weight: '400' },
};

// Function to get font URL from Google Fonts API
function getFontApiUrl(family, weight) {
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
}

async function extractTtfUrl(cssUrl) {
    try {
        const response = await fetch(cssUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; fontdownloader/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const css = await response.text();

        // Extract the truetype URL from the CSS
        const ttfMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);

        if (!ttfMatch) {
            throw new Error('TTF URL not found in CSS');
        }

        return ttfMatch[1];
    } catch (error) {
        console.error('Error extracting TTF URL:', error.message);
        return null;
    }
}

const FONTS_DIR = path.join(__dirname, '..', 'node_modules', '.fonts');

async function downloadFont(fontName, family, weight) {
    console.log(`Downloading ${fontName} (${family} weight ${weight})...`);

    try {
        // First, get the CSS to extract the TTF URL
        const cssUrl = getFontApiUrl(family, weight);
        let ttfUrl = await extractTtfUrl(cssUrl);

        if (!ttfUrl) {
            // Try with older user agent to force TTF
            const response = await fetch(cssUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0'
                }
            });
            const css = await response.text();
            const ttfMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
            if (ttfMatch) {
                ttfUrl = ttfMatch[1];
            }
        }

        if (!ttfUrl) {
            throw new Error('Could not extract TTF URL');
        }

        console.log(`  Found TTF URL: ${ttfUrl}`);

        // Download the TTF file
        const response = await fetch(ttfUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Compress the font data using pako (browser-compatible gzip)
        const compressed = pako.gzip(uint8Array);

        // Convert compressed data to base64
        const compressedBase64 = Buffer.from(compressed).toString('base64');

        // Calculate compression ratio
        const originalSize = uint8Array.length;
        const compressedSize = compressed.length;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

        console.log(`  Original: ${(originalSize / 1024).toFixed(1)}KB, Compressed: ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

        // Create the font file content with compressed data (CommonJS)
        const fontContent = `// Auto-generated compressed TTF font file for ${fontName}
// Original size: ${(originalSize / 1024).toFixed(1)}KB, Compressed: ${(compressedSize / 1024).toFixed(1)}KB
module.exports = {
  ${fontName.replace(/-/g, '_')}_compressed: "${compressedBase64}"
};
`;

        const outputPath = path.join(FONTS_DIR, `${fontName}.js`);
        fs.writeFileSync(outputPath, fontContent);

        console.log(`✓ Downloaded and converted ${fontName}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to download ${fontName}:`, error.message);
        return false;
    }
}

async function createFontIndex() {
    const indexContent = `// Auto-generated font index
const { geist_regular_compressed } = require('./geist-regular');
const { geist_bold_compressed } = require('./geist-bold');
const { geist_mono_regular_compressed } = require('./geist-mono-regular');

// Font mappings for jsPDF (compressed data)
const GEIST_FONTS_COMPRESSED = {
  regular: geist_regular_compressed,
  bold: geist_bold_compressed,
  monoRegular: geist_mono_regular_compressed,
};

module.exports = {
  GEIST_FONTS_COMPRESSED,
  geist_regular_compressed,
  geist_bold_compressed,
  geist_mono_regular_compressed
};
`;

    const indexPath = path.join(FONTS_DIR, 'index.js');
    fs.writeFileSync(indexPath, indexContent);

    // Create Type Definition
    const dtsContent = `// Auto-generated type definitions
export declare const geist_regular_compressed: string;
export declare const geist_bold_compressed: string;
export declare const geist_mono_regular_compressed: string;

export declare const GEIST_FONTS_COMPRESSED: {
  regular: string;
  bold: string;
  monoRegular: string;
};
`;
    const dtsPath = path.join(FONTS_DIR, 'index.d.ts');
    fs.writeFileSync(dtsPath, dtsContent);

    console.log('✓ Created font index file and type definitions');
}

async function main() {
    console.log('Setting up Geist TTF fonts for PDF generation...\n');

    // Create fonts directory if it doesn't exist
    if (!fs.existsSync(FONTS_DIR)) {
        fs.mkdirSync(FONTS_DIR, { recursive: true });
    }

    // Download all fonts
    const results = [];
    for (const [name, cfg] of Object.entries(FONT_VARIANTS)) {
        const success = await downloadFont(name, cfg.family, cfg.weight);
        results.push({ name, success });
    }

    // Create index file
    await createFontIndex();

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✓ Font setup complete! Downloaded ${successCount}/${results.length} Geist fonts for PDF generation.`);

    if (successCount === 0) {
        console.error('Warning: No fonts were downloaded successfully. PDF generation will fall back to default fonts.');
    }
}

// Only run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
