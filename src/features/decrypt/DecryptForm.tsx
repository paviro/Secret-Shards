'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { unpackShare, unpackData, identifyBlockType, BlockType, ShareBlock } from '@/lib/protocol/format';
import { Payload } from '@/lib/protocol/payload';
import { reconstructSecret } from '@/lib/encryption/core';
import { scanPdfForQrCodes, scanImageForQrCodes } from '@/lib/pdf/scan';
import InputZone from './components/InputZone';
import StatusBanner, { StatusMessage } from '@/components/StatusBanner';
import MissingDataList from './components/MissingDataList';
import LoadedItemsList from './components/LoadedItemsList';
import ResultView from './components/ResultView';
import { ScanResult } from './components/QrScanner';

export default function DecryptForm() {
    const [shares, setShares] = useState<ShareBlock[]>([]);

    // Data Chunks State
    const [dataChunks, setDataChunks] = useState<Map<number, Uint8Array>>(new Map());
    const [totalChunks, setTotalChunks] = useState<number | null>(null);
    const [dataId, setDataId] = useState<string | null>(null);

    // Encryption Info (IV/Alg) from Share
    const [encryptionInfo, setEncryptionInfo] = useState<{ iv: Uint8Array<ArrayBuffer>, algorithm: number } | null>(null);

    // Refs for tracking scan state across async operations to avoid stale closures
    const dataIdRef = useRef<string | null>(null);
    const shareIdRef = useRef<string | null>(null);
    const totalChunksRef = useRef<number | null>(null);
    const scanSessionIdRef = useRef<number>(0);

    // Sync refs with state
    useEffect(() => {
        dataIdRef.current = dataId;
    }, [dataId]);

    useEffect(() => {
        if (shares.length > 0) {
            shareIdRef.current = shares[0].id;
        } else if (shares.length === 0) {
            shareIdRef.current = null;
        }
    }, [shares]);

    useEffect(() => {
        totalChunksRef.current = totalChunks;
    }, [totalChunks]);

    // Result state
    const [decryptedPayload, setDecryptedPayload] = useState<Payload | null>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

    // Auto-hide status message after a short delay unless explicitly disabled (progress info)
    useEffect(() => {
        if (!statusMessage) return;
        const shouldAutoHide = statusMessage.autoHide ?? true;
        if (!shouldAutoHide) return;
        const timer = window.setTimeout(() => {
            setStatusMessage((current) => (current === statusMessage ? null : current));
        }, statusMessage.durationMs ?? 5000);
        return () => window.clearTimeout(timer);
    }, [statusMessage]);

    const clearErrorStatus = () => {
        setStatusMessage(prev => (prev?.variant === 'error' ? null : prev));
    };

    // Helper to process raw bytes (from File or decoded Base64)
    const processBytes = useCallback((bytes: Uint8Array, sourceName: string): ScanResult => {
        try {
            const type = identifyBlockType(bytes);

            if (type === BlockType.Share) {
                const share = unpackShare(bytes);
                let added = false;

                // Check ID match with existing data (using ref)
                if (dataIdRef.current && dataIdRef.current !== share.id) {
                    const msg = `Share ID mismatch in ${sourceName}! This share doesn't match the loaded data.`;
                    setStatusMessage({ variant: 'error', text: msg });
                    return { status: 'error', message: msg };
                }

                // Check ID match with existing shares (using ref)
                if (shareIdRef.current && shareIdRef.current !== share.id) {
                    const msg = `Share ID mismatch in ${sourceName}! This share belongs to a different secret.`;
                    setStatusMessage({ variant: 'error', text: msg });
                    return { status: 'error', message: msg };
                }

                // Check for duplicate synchronously using state
                if (shares.some(s => s.shareIndex === share.shareIndex && s.id === share.id)) {
                    return { status: 'duplicate', message: 'Share already added.' };
                }

                setShares(prev => {
                    if (prev.some(s => s.shareIndex === share.shareIndex && s.id === share.id)) {
                        return prev;
                    }
                    if (prev.length > 0 && prev[0].id !== share.id) {
                        // Should be caught by ref check but double checking
                        return prev;
                    }

                    added = true;
                    // Update ref immediately
                    shareIdRef.current = share.id;

                    // Also set encryption info if not set
                    if (!encryptionInfo) {
                        setEncryptionInfo({ iv: share.iv, algorithm: share.algorithm });
                    }

                    return [...prev, share];
                });

                if (added) {
                    clearErrorStatus();
                    return { status: 'success', label: `Share #${share.shareIndex + 1}` };
                }
                // If we reached here, it wasn't added but wasn't caught by synchronous duplicate check?
                // This implies a race condition or logic mismatch.
                // But since we checked shares.some above, it should be fine.
                return { status: 'duplicate', message: 'Share already added.', label: `Share #${share.shareIndex + 1}` };

            } else if (type === BlockType.Data) {
                const data = unpackData(bytes);

                // Check ID match
                if (shareIdRef.current && shareIdRef.current !== data.id) {
                    const msg = `Data ID mismatch in ${sourceName}! This data doesn't match the loaded shares.`;
                    setStatusMessage({ variant: 'error', text: msg });
                    return { status: 'error', message: msg, label: 'Mismatching Data' };
                }
                if (dataIdRef.current && dataIdRef.current !== data.id) {
                    const msg = `Data ID mismatch in ${sourceName}! This data belongs to a different secret.`;
                    setStatusMessage({ variant: 'error', text: msg });
                    return { status: 'error', message: msg, label: 'Mismatching Data' };
                }

                // Check duplicate
                if (dataChunks.has(data.chunkIndex)) {
                    // Check if content matches? For now just assume duplicate index is duplicate.
                    return { status: 'duplicate', message: 'Data chunk already added.', label: `Data Chunk ${data.chunkIndex + 1}/${data.totalChunks}` };
                }

                // Update Data State
                if (dataIdRef.current === null) {
                    dataIdRef.current = data.id; // Update ref
                    setDataId(data.id);
                }

                if (totalChunksRef.current === null) {
                    totalChunksRef.current = data.totalChunks; // Update ref
                    setTotalChunks(data.totalChunks);
                } else if (totalChunksRef.current !== data.totalChunks) {
                    // This is weird, but possible if corrupted or mixed versions
                    const msg = `Chunk says it's part of a ${data.totalChunks}-piece set, but your previously loaded data says ${totalChunksRef.current} pieces.`;
                    setStatusMessage({ variant: 'error', text: msg, autoHide: false });
                    return { status: 'error', message: msg, label: 'Corrupted Data' };
                }

                setDataChunks(prev => {
                    const next = new Map(prev);
                    next.set(data.chunkIndex, data.ciphertext);
                    return next;
                });

                clearErrorStatus();
                return { status: 'success', label: `Data Chunk ${data.chunkIndex + 1}/${data.totalChunks}` };
            }
        } catch (e) {
            console.error(e);
            return { status: 'error', message: 'Invalid format.', label: 'Invalid Code' };
        }
        return { status: 'error', message: 'Unknown block type.', label: 'Invalid Code' };
    }, [encryptionInfo, shares, dataChunks]);

    // Helper to process base64 string
    const processBase64 = useCallback((base64: string, sourceName: string): ScanResult => {
        try {
            const cleanBase64 = base64.trim();
            const binaryString = window.atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return processBytes(bytes, sourceName);
        } catch (e) {
            console.error("Base64 decode error", e);
            return { status: 'error', message: 'Invalid Base64.', label: 'Invalid Code' };
        }
    }, [processBytes]);


    const handleScan = (text: string): ScanResult => {
        return processBase64(text, "QR Code");
    };

    const handlePaste = (text: string) => {
        const result = processBase64(text, "Paste");
        if (result.status === 'success') {
            // Success
        } else if (result.status === 'duplicate') {
            setStatusMessage({ variant: 'error', text: result.message || "Already added." });
        } else {
            setStatusMessage({ variant: 'error', text: "Could not recognize pasted content" });
        }
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;

        const currentSessionId = scanSessionIdRef.current;
        setIsProcessing(true);
        const totalFiles = fileList.length;
        setStatusMessage({
            variant: 'info',
            text: `Processing ${totalFiles} file${totalFiles === 1 ? '' : 's'}...`,
            key: 'scanning',
            autoHide: false,
        });
        clearErrorStatus();

        let successfulScans = 0;
        const filesArray = Array.from(fileList);

        for (let fileIndex = 0; fileIndex < filesArray.length; fileIndex++) {
            if (currentSessionId !== scanSessionIdRef.current) return;
            const file = filesArray[fileIndex];
            const fileNumber = fileIndex + 1;
            const overallProgress = (fileIndex / totalFiles) * 100;

            try {
                // 1. Try processing as PDF (scan for QRs)
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    const matches = await scanPdfForQrCodes(file,
                        (progress) => {
                            if (currentSessionId !== scanSessionIdRef.current) return;
                            const fileProgress = (progress.page / progress.totalPages) * 100;
                            setStatusMessage({
                                variant: 'info',
                                text: `Scanning ${progress.fileName} (page ${progress.page}/${progress.totalPages})...`,
                                progress: fileProgress,
                                overallProgress: totalFiles > 1 ? overallProgress : undefined,
                                overallText: totalFiles > 1 ? `File ${fileNumber} of ${totalFiles}` : undefined,
                                key: 'scanning',
                                autoHide: false,
                            });
                        },
                        undefined,
                        () => currentSessionId === scanSessionIdRef.current
                    );

                    for (const match of matches) {
                        if (currentSessionId !== scanSessionIdRef.current) break;
                        if (processBase64(match.payload, file.name).status === 'success') {
                            successfulScans++;
                        }
                    }
                }
                // 2. Try processing as Image (scan for QR)
                else if (file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name)) {
                    setStatusMessage({
                        variant: 'info',
                        text: `Scanning image ${file.name}...`,
                        overallProgress: totalFiles > 1 ? overallProgress : undefined,
                        overallText: totalFiles > 1 ? `File ${fileNumber} of ${totalFiles}` : undefined,
                        key: 'scanning',
                        autoHide: false,
                    });
                    const payloads = await scanImageForQrCodes(file);
                    for (const payload of payloads) {
                        if (processBase64(payload, file.name).status === 'success') {
                            successfulScans++;
                        }
                    }
                }
                // 3. Try processing as raw binary file
                else {
                    setStatusMessage({
                        variant: 'info',
                        text: `Processing ${file.name}...`,
                        overallProgress: totalFiles > 1 ? overallProgress : undefined,
                        overallText: totalFiles > 1 ? `File ${fileNumber} of ${totalFiles}` : undefined,
                        key: 'scanning',
                        autoHide: false,
                    });
                    const buffer = await file.arrayBuffer();
                    const bytes = new Uint8Array(buffer);
                    if (processBytes(bytes, file.name).status === 'success') {
                        successfulScans++;
                    }
                }
            } catch (err) {
                console.error(`Error processing file ${file.name}:`, err);
            }
        }

        if (currentSessionId !== scanSessionIdRef.current) return;
        setIsProcessing(false);

        if (successfulScans > 0 || shares.length > 0 || dataChunks.size > 0) {
            setStatusMessage(null);
        } else {
            setStatusMessage({ variant: 'info', text: `No valid new shares or data found in files.` });
        }
    };

    const resetSessionState = () => {
        scanSessionIdRef.current += 1;
        setShares([]);
        setDataChunks(new Map());
        setTotalChunks(null);
        setDataId(null);
        setEncryptionInfo(null);
        setDecryptedPayload(null);
        setIsProcessing(false);
    };

    const handleReset = () => {
        resetSessionState();
        setStatusMessage(null);
    };

    const handleFatalPayloadError = (message: string) => {
        resetSessionState();
        setStatusMessage({ variant: 'error', text: message, autoHide: false });
    };

    const handleDecrypt = async () => {
        const currentSessionId = scanSessionIdRef.current;
        if (!encryptionInfo || !totalChunks || dataChunks.size !== totalChunks || shares.length === 0) return;

        try {
            const keyShares = shares.map(s => s.keyShare);
            const sortedChunks = Array.from(dataChunks.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([, chunk]) => chunk);

            const payload = await reconstructSecret({
                keyShares,
                chunks: sortedChunks,
                iv: encryptionInfo.iv,
                algorithm: encryptionInfo.algorithm,
            });
            if (currentSessionId !== scanSessionIdRef.current) return;
            setDecryptedPayload(payload);

            setStatusMessage(null);

        } catch (e) {
            console.error(e);
            const message = e instanceof Error ? e.message : String(e);
            if (message.includes('Unsupported payload version')) {
                handleFatalPayloadError('Unsupported payload version detected. Try refreshing the page in case a new version is available.');
                return;
            }
            setStatusMessage({ variant: 'error', text: "Decryption failed! Are the shares correct?", autoHide: false });
        }
    };

    // Calculate Todo items
    const requiredShares = shares.length > 0 ? shares[0].threshold : 0;
    const missingShares = Math.max(0, requiredShares - shares.length);

    // Data Status
    const chunksLoaded = dataChunks.size;
    const chunksTotal = totalChunks || '?';
    const isDataReady = totalChunks !== null && chunksLoaded === totalChunks;

    const isReady = shares.length >= requiredShares && isDataReady && requiredShares > 0 && !!encryptionInfo;

    useEffect(() => {
        if (isReady && !decryptedPayload) {
            void handleDecrypt();
        }
    }, [isReady, decryptedPayload]);

    const todos: Array<{ id: string; text: string; done: boolean; progress: number }> = [];

    // Data Todo
    if (!totalChunks) {
        todos.push({ id: 'data', text: 'Encrypted Data', done: false, progress: 0 });
    } else if (chunksLoaded < totalChunks) {
        const progress = (chunksLoaded / totalChunks) * 100;
        todos.push({ id: 'data', text: `Data Chunks: ${chunksLoaded} / ${chunksTotal}`, done: false, progress });
    } else {
        todos.push({ id: 'data', text: 'Encrypted Data Complete', done: true, progress: 100 });
    }

    // Shares Todo
    if (requiredShares === 0) {
        todos.push({ id: 'shares', text: 'Encryption Key Shares', done: false, progress: 0 });
    } else {
        const progress = Math.min((shares.length / requiredShares) * 100, 100);
        if (missingShares > 0) {
            todos.push({ id: 'shares', text: `Add ${missingShares} more share${missingShares === 1 ? '' : 's'}`, done: false, progress });
        } else {
            todos.push({ id: 'shares', text: `${shares.length} Shares Collected (Threshold: ${requiredShares})`, done: true, progress: 100 });
        }
    }

    if (decryptedPayload) {
        return <ResultView payload={decryptedPayload} onReset={handleReset} />;
    }

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <InputZone
                onScan={handleScan}
                onFiles={handleFiles}
                onPaste={handlePaste}
                isProcessing={isProcessing}
                collectedShares={shares.length}
                requiredShares={requiredShares}
                collectedData={chunksLoaded}
                totalData={totalChunks}
            />

            <StatusBanner
                statusMessage={statusMessage}
                isProcessing={isProcessing}
                onClose={() => setStatusMessage(null)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MissingDataList todos={todos} />
                <LoadedItemsList
                    shares={shares}
                    dataChunks={dataChunks}
                    totalChunks={totalChunks}
                    dataId={dataId}
                    onRemoveShare={(share) => setShares(s => s.filter(x => x !== share))}
                    onClearData={() => {
                        setDataChunks(new Map());
                        setTotalChunks(null);
                        setDataId(null);
                    }}
                />
            </div>
        </div>
    );
}
