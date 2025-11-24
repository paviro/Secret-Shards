'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface QrScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                if (!isMounted) return;

                if (devices && devices.length) {
                    const cameraId = devices[0].id;
                    // Use a unique ID for the instance or clear previous if any (though cleanup handles that)
                    const scanner = new Html5Qrcode("reader", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
                    scannerRef.current = scanner;

                    await scanner.start(
                        cameraId,
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                        },
                        (decodedText) => {
                            if (!isMounted) return;
                            onScan(decodedText);
                            // Stop scanning after success? Or let parent decide?
                            // Usually better to stop to prevent multiple triggers
                            scanner.stop().then(() => {
                                if (scannerRef.current === scanner) {
                                    scannerRef.current = null;
                                }
                                return scanner.clear();
                            }).catch(console.error);
                        },
                        (errorMessage) => {
                            // ignore errors for now
                        }
                    );
                } else {
                    if (isMounted) setError("No cameras found.");
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Failed to start camera.");
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    return scannerRef.current?.clear();
                }).catch(console.error);
            }
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 w-full max-w-md relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h3 className="text-lg font-semibold text-white mb-4 text-center">Scan QR Code</h3>

                <div id="reader" className="overflow-hidden rounded-xl border-2 border-indigo-500/30"></div>

                {error && (
                    <p className="text-red-400 text-sm text-center mt-4">{error}</p>
                )}

                <p className="text-slate-500 text-sm text-center mt-4">
                    Point your camera at a Secret Share or Encrypted Data QR code.
                </p>
            </div>
        </div>
    );
}
