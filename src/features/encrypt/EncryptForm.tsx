'use client';

import { useState, useEffect } from 'react';
import { Payload } from '@/lib/protocol/payload';
import { createSecretShares } from '@/lib/encryption/core';
import { generateShareArtifacts } from '@/lib/pdf/artifacts';
import SecretInput from './components/SecretInput';
import FileDropzone from './components/FileDropzone';
import ShareConfiguration, { isShareConfigurationValid } from './components/ShareConfiguration';
import PdfConfiguration from './components/PdfConfiguration';
import ResultView from './components/ResultView';
import StatusBanner, { StatusMessage } from '@/components/StatusBanner';

export default function EncryptForm() {
    const [text, setText] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [shares, setShares] = useState(5);
    const [threshold, setThreshold] = useState(3);
    const [title, setTitle] = useState('Secret Key Share');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
    const [result, setResult] = useState<{ pdfs: { name: string; url: string }[]; dataUrl?: string; dataName?: string; qrImages: { name: string; data: Uint8Array | string }[] } | null>(null);

    // Auto-hide status message after a short delay unless explicitly disabled
    useEffect(() => {
        if (!statusMessage) return;
        const shouldAutoHide = statusMessage.autoHide ?? true;
        if (!shouldAutoHide) return;
        const timer = window.setTimeout(() => {
            setStatusMessage((current) => (current === statusMessage ? null : current));
        }, 5000);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);

    const handleEncrypt = async () => {
        setIsProcessing(true);
        setResult(null);
        try {
            let payload: Payload;

            if (files.length > 0 && text) {
                const fileItems = await Promise.all(files.map(async (f) => ({
                    name: f.name,
                    type: f.type,
                    content: new Uint8Array(await f.arrayBuffer())
                })));

                payload = { type: 'mixed', text, files: fileItems };
            } else if (files.length > 0) {
                const fileItems = await Promise.all(files.map(async (f) => ({
                    name: f.name,
                    type: f.type,
                    content: new Uint8Array(await f.arrayBuffer())
                })));

                payload = { type: 'files', files: fileItems };
            } else {
                payload = { type: 'text', content: text };
            }

            // Force encrypted data output file name to a constant
            const dataFileName = 'encrypted-data.shd';

            // 1. Create Secret Shares (Crypto)
            const secretData = await createSecretShares({
                payload,
                shares,
                threshold,
            });

            // 2. Generate Artifacts (PDFs + data file)
            const jobResult = await generateShareArtifacts(secretData, {
                shares,
                threshold,
                title,
                dataFileName,
            });

            const pdfs = jobResult.pdfs.map((pdf) => {
                const blob = new Blob([pdf.data as unknown as BlobPart], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                return { name: pdf.name, url };
            });

            let dataUrl: string | undefined;
            let dataName: string | undefined;
            if (jobResult.dataFile) {
                const dataBlob = new Blob([jobResult.dataFile.data as unknown as BlobPart], { type: 'application/octet-stream' });
                dataUrl = URL.createObjectURL(dataBlob);
                dataName = jobResult.dataFile.name;
            }

            setResult({ pdfs, dataUrl, dataName, qrImages: jobResult.qrImages });

        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : String(e);
            let errorText = 'Encryption failed! ';

            // Provide more context based on the error
            if (message.includes('memory') || message.includes('Memory')) {
                errorText += 'The file might be too large. Try splitting it into smaller files.';
            } else if (message.includes('crypto') || message.includes('Crypto')) {
                errorText += 'A cryptographic operation failed. Please try again.';
            } else if (message) {
                errorText += message;
            } else {
                errorText += 'An unexpected error occurred. Please try again.';
            }

            setStatusMessage({ variant: 'error', text: errorText, autoHide: false });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setFiles([]);
        setText('');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!result ? (
                <>
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl">
                        <h2 className="text-xl font-semibold mb-6 text-indigo-300">1. Choose Secret</h2>

                        <div className="space-y-4">
                            <SecretInput text={text} onTextChange={setText} />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-slate-900 text-slate-500">AND / OR</span>
                                </div>
                            </div>

                            <FileDropzone files={files} onFilesChange={setFiles} />
                        </div>
                    </div>

                    <ShareConfiguration
                        shares={shares}
                        threshold={threshold}
                        onSharesChange={setShares}
                        onThresholdChange={setThreshold}
                    />

                    <PdfConfiguration title={title} onTitleChange={setTitle} />

                    <StatusBanner
                        statusMessage={statusMessage}
                        isProcessing={isProcessing}
                        onClose={() => setStatusMessage(null)}
                    />

                    <button
                        onClick={handleEncrypt}
                        disabled={(!text && files.length === 0) || isProcessing || !isShareConfigurationValid(shares, threshold)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99]"
                    >
                        {isProcessing ? 'Encrypting...' : 'Encrypt & Generate PDFs'}
                    </button>
                </>
            ) : (
                <ResultView result={result} threshold={threshold} totalShares={shares} onReset={handleReset} />
            )}
        </div>
    );
}
