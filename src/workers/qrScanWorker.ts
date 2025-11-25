// QR & barcode scanning worker powered by barcode-detector ponyfill (ZXing WASM)

import { BarcodeDetector, prepareZXingModule, type DetectedBarcode } from 'barcode-detector/ponyfill';

interface ScanRequest {
    type: 'scan';
    imageData: ArrayBuffer;
    width: number;
    height: number;
    transferId: string;
}

export interface ScanLocation {
    topLeftCorner: { x: number; y: number };
    topRightCorner: { x: number; y: number };
    bottomRightCorner: { x: number; y: number };
    bottomLeftCorner: { x: number; y: number };
}

export interface ScanMatch {
    data: string | null;
    location: ScanLocation | null;
}

interface ScanResult {
    type: 'result';
    matches: ScanMatch[];
    transferId: string;
}

interface ScanError {
    type: 'error';
    error: string;
    transferId: string;
}

type WorkerMessage = ScanRequest;
type WorkerResponse = ScanResult | ScanError;

const wasmReadyPromise = prepareZXingModule({
    overrides: {
        locateFile: (path, prefix) => {
            if (path.endsWith('.wasm')) {
                return new URL(`/wasm/${path}`, self.location.origin).toString();
            }
            return prefix + path;
        },
    },
});

let detectorPromise: Promise<BarcodeDetector> | null = null;

async function getBarcodeDetector() {
    if (!detectorPromise) {
        detectorPromise = (async () => {
            await wasmReadyPromise;
            return new BarcodeDetector({ formats: ['qr_code'] });
        })();
    }
    return detectorPromise;
}

function toScanLocation(detection: DetectedBarcode): ScanLocation | null {
    if (!detection.cornerPoints || detection.cornerPoints.length < 4) {
        return null;
    }

    const [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner] = detection.cornerPoints;
    return {
        topLeftCorner,
        topRightCorner,
        bottomRightCorner,
        bottomLeftCorner,
    };
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    if (message.type !== 'scan') {
        return;
    }

    try {
        const detector = await getBarcodeDetector();
        const imageDataArray = new Uint8ClampedArray(message.imageData);
        const imageData = new ImageData(imageDataArray, message.width, message.height);

        const detections = await detector.detect(imageData);

        const matches: ScanMatch[] = detections.map((detection) => ({
            data: detection.rawValue ?? null,
            location: toScanLocation(detection),
        }));

        const response: ScanResult = {
            type: 'result',
            matches,
            transferId: message.transferId,
        };

        self.postMessage(response);
    } catch (error) {
        const response: ScanError = {
            type: 'error',
            error: error instanceof Error ? error.message : String(error),
            transferId: message.transferId,
        };

        self.postMessage(response);
    }
});

// Export types for the worker client
export type { WorkerMessage, WorkerResponse, ScanRequest, ScanResult, ScanError };
