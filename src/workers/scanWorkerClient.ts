// QR Scan Worker Client
// Provides a clean API for QR code scanning using a web worker

import type { ScanMatch, WorkerResponse } from '@/workers/qrScanWorker';

class QrScanWorkerClient {
    private worker: Worker | null = null;
    private pendingScans = new Map<string, {
        resolve: (result: { matches: ScanMatch[] }) => void;
        reject: (error: Error) => void;
    }>();
    private nextTransferId = 0;

    private ensureWorker(): Worker {
        if (!this.worker) {
            this.worker = new Worker(
                new URL('@/workers/qrScanWorker.ts', import.meta.url),
                { type: 'module' }
            );

            this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
                const message = event.data;
                const pending = this.pendingScans.get(message.transferId);

                if (!pending) {
                    console.warn('Received response for unknown transfer ID:', message.transferId);
                    return;
                }

                this.pendingScans.delete(message.transferId);

                if (message.type === 'result') {
                    pending.resolve({ matches: message.matches });
                } else if (message.type === 'error') {
                    pending.reject(new Error(message.error));
                }
            });

            this.worker.addEventListener('error', (error) => {
                console.error('QR scan worker error:', error);
                // Reject all pending scans
                for (const pending of this.pendingScans.values()) {
                    pending.reject(new Error('Worker error'));
                }
                this.pendingScans.clear();
                this.worker = null;
            });

            // Cleanup on page unload
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    this.terminate();
                });
            }
        }

        return this.worker;
    }

    async scanImageData(imageData: ImageData): Promise<{ matches: ScanMatch[] }> {
        const worker = this.ensureWorker();
        const transferId = `${Date.now()}-${this.nextTransferId++}`;

        return new Promise<{ matches: ScanMatch[] }>((resolve, reject) => {
            this.pendingScans.set(transferId, { resolve, reject });

            // Transfer the buffer to avoid copying
            const buffer = imageData.data.buffer;
            worker.postMessage({
                type: 'scan',
                imageData: buffer,
                width: imageData.width,
                height: imageData.height,
                transferId,
            }, [buffer]);
        });
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        // Reject all pending scans
        for (const pending of this.pendingScans.values()) {
            pending.reject(new Error('Worker terminated'));
        }
        this.pendingScans.clear();
    }
}

// Singleton instance
let clientInstance: QrScanWorkerClient | null = null;

export function getQrScanWorker(): QrScanWorkerClient {
    if (!clientInstance) {
        clientInstance = new QrScanWorkerClient();
    }
    return clientInstance;
}

export function terminateQrScanWorker() {
    if (clientInstance) {
        clientInstance.terminate();
        clientInstance = null;
    }
}
