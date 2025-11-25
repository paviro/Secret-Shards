import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';

export type StatusMessage = {
    variant: 'info' | 'success' | 'error';
    text: string;
    progress?: number;
    overallProgress?: number;
    overallText?: string;
    autoHide?: boolean;
    durationMs?: number;
    key?: string;
};

interface StatusBannerProps {
    statusMessage: StatusMessage | null;
    isProcessing: boolean;
    onClose: () => void;
}

export default function StatusBanner({ statusMessage, isProcessing, onClose }: StatusBannerProps) {
    // Generate a unique key internally whenever the message changes
    const internalKeyRef = useRef(0);
    const prevMessageRef = useRef<StatusMessage | null>(null);

    useEffect(() => {
        if (statusMessage !== prevMessageRef.current) {
            internalKeyRef.current++;
            prevMessageRef.current = statusMessage;
        }
    }, [statusMessage]);
    return (
        <AnimatePresence>
            {statusMessage && (
                <motion.div
                    layout
                    key="status-container"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className={`rounded-xl text-sm overflow-hidden relative transition-colors duration-300 ${statusMessage.variant === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                        statusMessage.variant === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                >
                    {/* Countdown timer shows when autoHide is not explicitly disabled (defaults to true) */}
                    {(statusMessage.autoHide ?? true) && (
                        <motion.div
                            key={`countdown-${internalKeyRef.current}`}
                            initial={{ width: "100%" }}
                            animate={{ width: "0%" }}
                            transition={{
                                duration: (statusMessage.durationMs ?? 5000) / 1000,
                                ease: "linear",
                                delay: 0.2 // Wait for parent enter animation
                            }}
                            className="absolute bottom-0 left-0 h-1 bg-current opacity-50"
                        />
                    )}

                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={statusMessage.key ?? statusMessage.text}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="p-4"
                        >
                            <div className="flex items-center gap-2 h-full min-h-[24px]">
                                {statusMessage.variant === 'info' && isProcessing && (
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                {statusMessage.variant === 'success' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                                <span className="text-center flex-1">{statusMessage.text}</span>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Dismiss message"
                                    className={`inline-flex items-center justify-center rounded-lg p-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${statusMessage.variant === 'success' ? 'hover:bg-green-500/10' :
                                        statusMessage.variant === 'error' ? 'hover:bg-red-500/10' :
                                            'hover:bg-blue-500/10'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Overall progress bar (only shown when processing multiple files) */}
                            {statusMessage.overallProgress !== undefined && statusMessage.variant === 'info' && (
                                <div className="space-y-1 mb-2 mt-2">
                                    <div className="flex justify-between items-center text-xs text-blue-300/80">
                                        <span>{statusMessage.overallText}</span>
                                        <span>{Math.round(statusMessage.overallProgress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-500/70 h-full transition-all duration-300 ease-out rounded-full"
                                            style={{ width: `${statusMessage.overallProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Per-file progress bar */}
                            {statusMessage.progress !== undefined && statusMessage.variant === 'info' && (
                                <div className="space-y-1 mt-2">
                                    {statusMessage.overallProgress !== undefined && (
                                        <div className="text-xs text-blue-300/80">Current file progress</div>
                                    )}
                                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-400 h-full transition-all duration-300 ease-out rounded-full"
                                            style={{ width: `${statusMessage.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
