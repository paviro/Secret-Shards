'use client';

import { useCamera } from '@/features/decrypt/components/QrScanner/hooks/useCamera';
import { useQrScanner, type ScanResult } from '@/features/decrypt/components/QrScanner/hooks/useQrScanner';
import CodeOverlay from '@/features/decrypt/components/QrScanner/components/CodeOverlay';
import { ScannerProgress, ScannerReticle } from '@/features/decrypt/components/QrScanner/components/ScannerHud';
import ScannerControls from '@/features/decrypt/components/QrScanner/components/ScannerControls';
import AnimatedBackground from './AnimatedBackground';

interface FullscreenQrScannerProps {
    onScan: (decodedText: string) => Promise<ScanResult> | ScanResult;
    collectedShares: number;
    requiredShares: number;
    collectedData: number;
    totalData: number | null;
    onReset: () => void;
    isScanning: boolean;
}

export default function FullscreenQrScanner({
    onScan,
    collectedShares,
    requiredShares,
    collectedData,
    totalData,
    onReset,
    isScanning
}: FullscreenQrScannerProps) {
    const {
        videoRef,
        cameras,
        currentCameraId,
        error,
        hasFlash,
        flashOn,
        switchCamera,
        toggleFlash,
    } = useCamera(isScanning);

    const {
        detectionsRef,
        overlayFlashRef
    } = useQrScanner({
        videoRef,
        onScan
    });

    if (!isScanning) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center">
                <AnimatedBackground />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Main Camera View */}
            <div className="relative flex-1 w-full overflow-hidden bg-black">
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                />

                <CodeOverlay
                    videoRef={videoRef}
                    detectionsRef={detectionsRef}
                    overlayFlashRef={overlayFlashRef}
                />

                {!currentCameraId && !error && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                )}

                {/* Reticle (Centered) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                    <ScannerReticle className="w-[28rem] h-[24rem]" />
                </div>

                {/* Top HUD (Progress Only) */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-30 bg-gradient-to-b from-black/60 to-transparent pb-12 pointer-events-none">
                     <div className="w-full flex flex-col gap-4 pointer-events-auto">
                        <div className="flex justify-center items-start">
                            <ScannerProgress 
                                collectedShares={collectedShares}
                                requiredShares={requiredShares}
                                collectedData={collectedData}
                                totalData={totalData}
                                className="flex-1"
                            />
                        </div>
                     </div>
                </div>

                {/* Bottom Controls (HUD Style) */}
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe z-30 bg-gradient-to-t from-black/80 to-transparent pt-24">
                     <div className="max-w-md mx-auto">
                        {error ? (
                            <p className="text-red-400 text-sm text-center mb-4 bg-black/50 p-2 rounded-lg backdrop-blur-sm">{error}</p>
                        ) : null}
                        
                        <ScannerControls
                            hasFlash={hasFlash}
                            flashOn={flashOn}
                            onToggleFlash={toggleFlash}
                            showSwitchCamera={cameras.length > 1}
                            onSwitchCamera={switchCamera}
                            onReset={onReset}
                            variant="hud"
                        />
                     </div>
                </div>
            </div>
        </div>
    );
}
