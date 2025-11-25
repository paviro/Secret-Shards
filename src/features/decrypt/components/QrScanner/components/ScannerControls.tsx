import React, { useEffect, useState } from 'react';

interface ScannerControlsProps {
    hasFlash: boolean;
    flashOn: boolean;
    onToggleFlash: () => void;
    showSwitchCamera: boolean;
    onSwitchCamera: () => void;
}

export default function ScannerControls({
    hasFlash,
    flashOn,
    onToggleFlash,
    showSwitchCamera,
    onSwitchCamera
}: ScannerControlsProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }, []);

    return (
        <div className="flex justify-center items-center mt-4 gap-4">
            {hasFlash && (
                <button
                    onClick={onToggleFlash}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all ${flashOn
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {flashOn ? 'Flash On' : 'Flash Off'}
                </button>
            )}

            {showSwitchCamera && (
                <button
                    onClick={onSwitchCamera}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-medium transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isMobile ? 'Flip' : 'Switch Camera'}
                </button>
            )}
        </div>
    );
}

