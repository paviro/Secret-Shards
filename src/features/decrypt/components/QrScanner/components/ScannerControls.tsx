import React, { useMemo } from 'react';
import { ArrowPathIcon, BoltIcon, BoltSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ScannerControlsProps {
    hasFlash: boolean;
    flashOn: boolean;
    onToggleFlash: () => void;
    showSwitchCamera: boolean;
    onSwitchCamera: () => void;
    onReset?: () => void;
    variant?: 'default' | 'hud';
}

export default function ScannerControls({
    hasFlash,
    flashOn,
    onToggleFlash,
    showSwitchCamera,
    onSwitchCamera,
    onReset,
    variant = 'default'
}: ScannerControlsProps) {
    const isMobile = useMemo(() => {
        if (typeof navigator === 'undefined') return false;
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }, []);

    const defaultBtnClass = "flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all";
    const hudBtnClass = "flex flex-col items-center justify-center w-16 h-16 rounded-full backdrop-blur-md border border-white/20 transition-all shadow-lg";

    return (
        <div className={`flex justify-center items-center gap-4 ${variant === 'default' ? 'mt-4' : ''}`}>
            {variant === 'hud' && onReset && (
                <button
                    onClick={onReset}
                    className={`${hudBtnClass} bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-300`}
                >
                    <XMarkIcon className="w-8 h-8" stroke="currentColor" strokeWidth={1} />
                </button>
            )}

            {hasFlash && (
                <button
                    onClick={onToggleFlash}
                    className={variant === 'default'
                        ? `${defaultBtnClass} ${flashOn ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`
                        : `${hudBtnClass} ${flashOn ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' : 'bg-black/30 hover:bg-black/50 text-white'}`
                    }
                >
                    {variant === 'default' ? (
                        <>
                            {(flashOn ? <BoltIcon className="w-5 h-5" aria-hidden="true" /> : <BoltSlashIcon className="w-5 h-5" aria-hidden="true" />)}
                            {flashOn ? 'Flash On' : 'Flash Off'}
                        </>
                    ) : (
                        flashOn ? (
                            <BoltIcon className="w-7 h-7" aria-hidden="true" />
                        ) : (
                            <BoltSlashIcon className="w-7 h-7" aria-hidden="true" />
                        )
                    )}
                </button>
            )}

            {showSwitchCamera && (
                <button
                    onClick={onSwitchCamera}
                    className={variant === 'default'
                        ? `${defaultBtnClass} bg-slate-800 hover:bg-slate-700 text-slate-300`
                        : `${hudBtnClass} bg-black/30 hover:bg-black/50 text-white`
                    }
                >
                    <ArrowPathIcon className={variant === 'default' ? 'w-5 h-5' : 'w-7 h-7'} aria-hidden="true" />
                    {variant === 'default' && (isMobile ? 'Flip' : 'Switch Camera')}
                </button>
            )}
        </div>
    );
}
