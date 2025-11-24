// QR Code Scanning Web Worker
// This worker offloads CPU-intensive QR code scanning to a background thread

let jsQR: typeof import('jsqr').default | null = null;

interface ScanRequest {
    type: 'scan';
    imageData: ArrayBuffer;
    width: number;
    height: number;
    transferId: string;
}

interface ScanResult {
    type: 'result';
    data: string | null;
    transferId: string;
}

interface ScanError {
    type: 'error';
    error: string;
    transferId: string;
}

type WorkerMessage = ScanRequest;
type WorkerResponse = ScanResult | ScanError;

// Lazy load jsQR library
async function ensureJsQR() {
    if (!jsQR) {
        const module = await import('jsqr');
        jsQR = module.default;
    }
    return jsQR;
}

// Handle incoming messages
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    if (message.type === 'scan') {
        try {
            const qrScanner = await ensureJsQR();

            // Convert ArrayBuffer back to Uint8ClampedArray
            const imageDataArray = new Uint8ClampedArray(message.imageData);

            // Scan for QR code
            const result = qrScanner(imageDataArray, message.width, message.height, {
                inversionAttempts: 'attemptBoth',
            });

            const response: ScanResult = {
                type: 'result',
                data: result ? result.data : null,
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
    }
});

// Export types for the worker client
export type { WorkerMessage, WorkerResponse, ScanRequest, ScanResult, ScanError };
