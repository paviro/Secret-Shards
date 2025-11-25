'use client';

import { useCamera } from './hooks/useCamera';
import { useQrScanner, type ScanResult } from './hooks/useQrScanner';
import CodeOverlay from './components/CodeOverlay';
import ScannerHud from './components/ScannerHud';
import ScannerControls from './components/ScannerControls';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface QrScannerProps {
    onScan: (decodedText: string) => Promise<ScanResult> | ScanResult;
    onClose: () => void;
    collectedShares: number;
    requiredShares: number;
    collectedData: number;
    totalData: number | null;
}

// Re-export ScanResult for consumers
export type { ScanResult };

export default function QrScanner({
    onScan,
    onClose,
    collectedShares,
    requiredShares,
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 px-6 pt-6 pb-4 w-full max-w-md relative shadow-2xl flex flex-col max-h-[90vh]">
                <button
                    onClick={() => {
                        stopStream();
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
                        collectedShares={collectedShares}
                        requiredShares={requiredShares}
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
            </div>
        </div>
    );
}
