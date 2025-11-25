import { getQrScanWorker } from '@/workers/scanWorkerClient';

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
let workerInitialized = false;

async function loadPdfJs() {
    if (!pdfjsPromise) {
        pdfjsPromise = import('pdfjs-dist');
    }
    return pdfjsPromise;
}


async function ensureWorker(pdfjs: typeof import('pdfjs-dist')) {
    if (workerInitialized || typeof window === 'undefined') {
        return;
    }

    const workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
    ).toString();

    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    workerInitialized = true;
}

export interface PdfScanProgress {
    fileName: string;
    page: number;
    totalPages: number;
}

export interface PdfQrMatch {
    payload: string;
    page: number;
}

export async function scanPdfForQrCodes(
    file: File,
    onProgress?: (progress: PdfScanProgress) => void,
    onMatch?: (match: PdfQrMatch) => void,
    shouldContinue?: () => boolean
): Promise<PdfQrMatch[]> {
    if (typeof document === 'undefined') {
        throw new Error('PDF scanning is only available in the browser.');
    }

    const pdfjs = await loadPdfJs();
    const qrWorker = getQrScanWorker();

    await ensureWorker(pdfjs);

    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        await loadingTask.destroy();
        throw new Error('Unable to create 2D canvas context for PDF scanning.');
    }

    const matches: PdfQrMatch[] = [];

    try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            if (shouldContinue && !shouldContinue()) {
                break;
            }
            const page = await pdf.getPage(pageNumber);
            onProgress?.({
                fileName: file.name,
                page: pageNumber,
                totalPages: pdf.numPages,
            });

            const scales = [2, 2.5, 3];
            let decodedText: string | null = null;

            for (const scale of scales) {
                if (shouldContinue && !shouldContinue()) {
                    break;
                }
                const viewport = page.getViewport({ scale });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                context.setTransform(1, 0, 0, 1, 0, 0);
                context.clearRect(0, 0, canvas.width, canvas.height);

                const renderTask = page.render({
                    canvas,
                    canvasContext: context,
                    viewport,
                });
                await renderTask.promise;

                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const result = await qrWorker.scanImageData(imageData);
                const match = result.matches.find(m => m.data);

                if (match?.data) {
                    decodedText = match.data;
                    break;
                }
            }

            page.cleanup();

            if (decodedText) {
                const match = { payload: decodedText, page: pageNumber };
                matches.push(match);
                onMatch?.(match);
            }
        }
    } finally {
        canvas.width = 0;
        canvas.height = 0;
        await loadingTask.destroy();
    }

    return matches;
}


export async function scanImageForQrCodes(file: File): Promise<string | null> {
    if (typeof document === 'undefined') {
        throw new Error('Image scanning is only available in the browser.');
    }

    const qrWorker = getQrScanWorker();

    // Load image
    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });
    } catch (e) {
        URL.revokeObjectURL(url);
        console.error('Failed to load image for scanning', e);
        return null;
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
        URL.revokeObjectURL(url);
        throw new Error('Unable to create canvas context');
    }

    canvas.width = img.width;
    canvas.height = img.height;

    // Optimization: Downscale large images to improve performance
    // Scanning a 12MP photo takes significantly longer than a 2MP resize
    const MAX_DIMENSION = 2000;
    if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        const scale = Math.min(MAX_DIMENSION / img.width, MAX_DIMENSION / img.height);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
    }

    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = await qrWorker.scanImageData(imageData);
    const match = result.matches.find(m => m.data);

    URL.revokeObjectURL(url);
    return match?.data ?? null;
}

