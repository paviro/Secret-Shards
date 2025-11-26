'use client';

import { useCamera } from './hooks/useCamera';
import { useQrScanner, type ScanResult } from './hooks/useQrScanner';
import CodeOverlay from './components/CodeOverlay';
import ScannerHud from './components/ScannerHud';
import ScannerControls from './components/ScannerControls';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, type Variants } from 'framer-motion';
import { useEffect } from 'react';

interface QrScannerProps {
    onScan: (decodedText: string) => Promise<ScanResult> | ScanResult;
    onClose: () => void;
    collectedKeyShares: number;
    requiredKeyShares: number;
    collectedData: number;
    totalData: number | null;
}

// Re-export ScanResult for consumers
export type { ScanResult };

export default function QrScanner({
    onScan,
    onClose,
    collectedKeyShares,
    requiredKeyShares,
    collectedData,
    totalData
}: QrScannerProps) {
    const {
        videoRef,
        cameras,
        currentCameraId,
        error,
        hasFlash,
        flashOn,
        switchCamera,
        toggleFlash,
        stopStream
    } = useCamera();

    const {
        detectionsRef,
        overlayFlashRef
    } = useQrScanner({
        videoRef,
        onScan
    });

    const backdropVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
        exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }
    } satisfies Variants;

    const cardVariants = {
        initial: { scale: 0.85, opacity: 0, y: 32 },
        animate: {
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 360, damping: 20, mass: 0.7 }
        },
        exit: {
            scale: [1, 1.08, 0.82],
            opacity: [1, 1, 0],
            y: [0, -4, 18],
            transition: {
                duration: 0.3,
                ease: ['easeOut', 'easeIn'] as const,
                times: [0, 0.45, 1]
            }
        }
    } satisfies Variants;

    useEffect(() => {
        return () => {
            stopStream();
        };
    }, [stopStream]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <motion.div
                className="bg-slate-900 rounded-2xl border border-slate-800 px-6 pt-6 pb-4 w-full max-w-md relative shadow-2xl flex flex-col max-h-[90vh]"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <button
                    onClick={() => {
                        onClose();
                    }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white z-10 bg-slate-800/50 hover:bg-slate-800 rounded-full p-2 transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" stroke="currentColor" strokeWidth={2} />
                </button>

                <h3 className="text-lg font-semibold text-white mb-4 text-center">Scan QR Code</h3>

                <div className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4] flex items-center justify-center group shadow-inner">
                    {/* Video element visible now */}
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                    />

                    {/* Canvas overlay for detections */}
                    <CodeOverlay
                        videoRef={videoRef}
                        detectionsRef={detectionsRef}
                        overlayFlashRef={overlayFlashRef}
                    />

                    {!currentCameraId && !error && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}

                    {/* Scanner HUD (Progress + Static Overlay) */}
                    <ScannerHud
                        collectedKeyShares={collectedKeyShares}
                        requiredKeyShares={requiredKeyShares}
                        collectedData={collectedData}
                        totalData={totalData}
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-sm text-center mt-4">{error}</p>
                )}

                <ScannerControls
                    hasFlash={hasFlash}
                    flashOn={flashOn}
                    onToggleFlash={toggleFlash}
                    showSwitchCamera={cameras.length > 1}
                    onSwitchCamera={switchCamera}
                />
            </motion.div>
        </motion.div>
    );
}
