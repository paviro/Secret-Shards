import { useEffect, useRef, useState, MutableRefObject } from 'react';
import { getQrScanWorker } from '@/workers/scanWorkerClient';
import type { ScanLocation } from '@/workers/qrScanWorker';

export type ScanStatus = 'success' | 'duplicate' | 'error';

export type ScanResult = {
    status: ScanStatus;
    message?: string;
    label?: string;
};

export type DetectionOverlay = {
    location: ScanLocation;
    status: ScanStatus;
    timestamp: number;
    data?: string;
    label?: string;
};

type CachedStatus = {
    status: ScanStatus;
    timestamp: number;
    label?: string;
};

interface UseQrScannerProps {
    videoRef: MutableRefObject<HTMLVideoElement | null>;
    onScan: (decodedText: string) => Promise<ScanResult> | ScanResult;
}

export function useQrScanner({ videoRef, onScan }: UseQrScannerProps) {
    const processingRef = useRef(false);
    const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const scanCache = useRef<Map<string, CachedStatus>>(new Map());
    const detectionsRef = useRef<DetectionOverlay[]>([]);
    const overlayFlashRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        let isScanning = true;

        const scanLoop = async () => {
            if (!isScanning) return;

            if (videoRef.current &&
                videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
                !processingRef.current) {

                processingRef.current = true;

                try {
                    const video = videoRef.current;

                    if (!scanCanvasRef.current) {
                        scanCanvasRef.current = document.createElement('canvas');
                    }
                    const scanCanvas = scanCanvasRef.current;

                    if (scanCanvas.width !== video.videoWidth || scanCanvas.height !== video.videoHeight) {
                        scanCanvas.width = video.videoWidth;
                        scanCanvas.height = video.videoHeight;
                    }

                    const scanCtx = scanCanvas.getContext('2d', { willReadFrequently: true });

                    if (scanCtx) {
                        scanCtx.drawImage(video, 0, 0);
                        const imageData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);

                        const worker = getQrScanWorker();
                        const result = await worker.scanImageData(imageData);

                        if (result.matches.length > 0) {
                            const overlayResults: DetectionOverlay[] = [];
                            for (const match of result.matches) {
                                if (!match.data) continue;

                                let status: ScanStatus = 'success';
                                let label: string | undefined;
                                const cached = scanCache.current.get(match.data);

                                if (cached) {
                                    status = cached.status;
                                    label = cached.label;
                                } else {
                                    try {
                                        const scanResult = await onScan(match.data);
                                        status = scanResult.status;
                                        label = scanResult.label;
                                        scanCache.current.set(match.data, { status, label, timestamp: Date.now() });

                                        if (status === 'success') {
                                            overlayFlashRef.current.set(
                                                match.data,
                                                typeof performance !== 'undefined' ? performance.now() : Date.now()
                                            );
                                        }
                                    } catch (e) {
                                        console.error("Error processing scan:", e);
                                        status = 'error';
                                    }
                                }

                                if (match.location) {
                                    overlayResults.push({
                                        location: match.location,
                                        status,
                                        timestamp: Date.now(),
                                        data: match.data,
                                        label
                                    });
                                }
                            }

                            detectionsRef.current = overlayResults;
                        } else {
                            detectionsRef.current = [];
                        }
                    }
                } catch (err) {
                    console.error("Scan error:", err);
                } finally {
                    processingRef.current = false;
                }
            }

            if (isScanning) {
                requestAnimationFrame(scanLoop);
            }
        };

        scanLoop();

        return () => {
            isScanning = false;
        };
    }, [onScan, videoRef]);

    return {
        detectionsRef,
        overlayFlashRef
    };
}

