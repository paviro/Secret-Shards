'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { BlockType, identifyBlockType } from '@/lib/protocol/shared';
import { unpackKeyShare } from '@/lib/protocol/keyShare';
import { unpackEncryptedPayload } from '@/lib/protocol/encryptedPayload';
import { reconstructSecret } from '@/lib/encryption/core';
import ResultView from '@/features/decrypt/components/ResultView';
import FullscreenQrScanner from './components/FullscreenQrScanner';
import GeocacheDisclaimer from './components/GeocacheDisclaimer';
import { useGeocacheStorage } from './hooks/useGeocacheStorage';
import { ScanResult } from '@/features/decrypt/components/QrScanner/hooks/useQrScanner';
import { useAnimatedBackground } from '@/context/AnimatedBackgroundContext';

const SESSION_STARTED_KEY = 'geocache-session-started';

export default function GeocacheScanner() {
    const {
        shares,
        dataChunks,
        totalChunks,
        dataId,
        encryptionInfo,
        decryptedDataArchive,
        saveState,
        clearSession,
        isLoaded
    } = useGeocacheStorage();
    const { enable: enableBackground, disable: disableBackground } = useAnimatedBackground();
    const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.localStorage.getItem(SESSION_STARTED_KEY) === 'true';
    });

    // Local Refs for async access
    const dataIdRef = useRef<string | null>(null);
    const shareIdRef = useRef<string | null>(null);

    // Sync Refs with Storage
    useEffect(() => {
        if (!isLoaded) return;
        dataIdRef.current = dataId;
        shareIdRef.current = shares.length > 0 ? shares[0].id : null;
    }, [isLoaded, dataId, shares]);

    const sessionHasProgress = shares.length > 0 || dataChunks.size > 0;
    const shouldAutoResume = sessionHasProgress && !decryptedDataArchive;
    const shouldShowDisclaimer = !hasAcceptedDisclaimer && !shouldAutoResume && !decryptedDataArchive;
    const isScanningActive = (hasAcceptedDisclaimer || shouldAutoResume) && !decryptedDataArchive;
    const shouldRenderScanner = !decryptedDataArchive;

    useEffect(() => {
        if (decryptedDataArchive || shouldShowDisclaimer) {
            enableBackground();
        } else {
            disableBackground();
        }

        return () => {
            enableBackground();
        };
    }, [decryptedDataArchive, shouldShowDisclaimer, enableBackground, disableBackground]);

    // Process Bytes Logic
    const processBytes = useCallback((bytes: Uint8Array): ScanResult => {
        try {
            const type = identifyBlockType(bytes);

            if (type === BlockType.KeyShare) {
                const share = unpackKeyShare(bytes);

                // Validation checks
                if (shareIdRef.current && shareIdRef.current !== share.id) {
                    const msg = `Share ID mismatch!`;
                    return { status: 'error', message: msg };
                }
                if (shares.some(s => s.shareIndex === share.shareIndex && s.id === share.id)) {
                    return { status: 'duplicate', message: 'Share already added.' };
                }

                // Add Share
                const newShares = [...shares, share];
                const newEncryptionInfo = encryptionInfo || { iv: share.iv, algorithm: share.algorithm };
                shareIdRef.current = share.id;
                if (!dataIdRef.current) {
                    dataIdRef.current = share.id;
                }

                saveState(
                    newShares,
                    dataChunks,
                    totalChunks,
                    dataId,
                    newEncryptionInfo,
                    decryptedDataArchive
                );

                return { status: 'success', label: `Share #${share.shareIndex + 1}` };

            } else if (type === BlockType.EncryptedPayload) {
                const data = unpackEncryptedPayload(bytes);

                // Validation
                if (dataIdRef.current && dataIdRef.current !== data.id) {
                    const msg = `Data ID mismatch!`;
                    return { status: 'error', message: msg, label: 'Mismatch' };
                }
                if (shareIdRef.current && shareIdRef.current !== data.id) {
                    const msg = `Data ID mismatch!`;
                    return { status: 'error', message: msg, label: 'Mismatch' };
                }
                if (dataChunks.has(data.chunkIndex)) {
                    return { status: 'duplicate', message: 'Chunk already added.', label: `Data ${data.chunkIndex + 1}/${data.totalChunks}` };
                }

                // Update Data
                const newDataId = dataId || data.id;
                const newTotalChunks = totalChunks || data.totalChunks;
                dataIdRef.current = newDataId;

                if (totalChunks !== null && totalChunks !== data.totalChunks) {
                    const msg = `Chunk count mismatch! Expected ${totalChunks}, got ${data.totalChunks}.`;
                    return { status: 'error', message: msg, label: 'Error' };
                }

                const newDataChunks = new Map(dataChunks);
                newDataChunks.set(data.chunkIndex, data.ciphertext);

                saveState(
                    shares,
                    newDataChunks,
                    newTotalChunks,
                    newDataId,
                    encryptionInfo,
                    decryptedDataArchive
                );

                return { status: 'success', label: `Data ${data.chunkIndex + 1}/${data.totalChunks}` };
            }
        } catch (e) {
            console.error(e);
            return { status: 'error', message: 'Invalid format.', label: 'Invalid' };
        }
        return { status: 'error', message: 'Unknown block type.', label: 'Invalid' };
    }, [shares, dataChunks, totalChunks, dataId, encryptionInfo, decryptedDataArchive, saveState]);

    const handleScan = (text: string): ScanResult => {
        try {
            const cleanBase64 = text.trim();
            const binaryString = window.atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return processBytes(bytes);
        } catch {
            return { status: 'error', message: 'Invalid Base64.', label: 'Error' };
        }
    };

    const handleDecrypt = useCallback(async () => {
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

            // Save decrypted result
            saveState(
                shares,
                dataChunks,
                totalChunks,
                dataId,
                encryptionInfo,
                payload
            );

        } catch (e) {
            console.error(e);
            alert('Decryption failed. Check that you have all required shares and data chunks, then try again.');
        }
    }, [shares, dataChunks, totalChunks, dataId, encryptionInfo, saveState]);

    // Auto-decrypt when ready
    const requiredKeyShares = shares[0]?.threshold ?? 0;
    const isDataReady = totalChunks !== null && dataChunks.size === totalChunks;
    const isReady = shares.length >= requiredKeyShares && isDataReady && requiredKeyShares > 0 && !!encryptionInfo;

    useEffect(() => {
        if (isReady && !decryptedDataArchive) {
            void handleDecrypt();
        }
    }, [isReady, decryptedDataArchive, handleDecrypt]);

    // Calculate progress for HUD
    const collectedKeyShares = shares.length;
    const collectedData = dataChunks.size;
    const totalData = totalChunks;

    if (!isLoaded) return null; // or loading spinner

    const handleNewSession = () => {
        if (confirm("Are you sure? This will clear all scanned data and restart the session.")) {
            clearSession();
            dataIdRef.current = null;
            shareIdRef.current = null;
            setHasAcceptedDisclaimer(false);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(SESSION_STARTED_KEY);
            }
        }
    };

    const handleStartSession = () => {
        setHasAcceptedDisclaimer(true);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(SESSION_STARTED_KEY, 'true');
        }
    };

    if (decryptedDataArchive) {
        return (
            <div className="flex items-center justify-center p-4 min-h-screen text-slate-100">
                <div className="w-full max-w-md">
                    <ResultView
                        dataArchive={decryptedDataArchive}
                        onReset={handleNewSession}
                        resetLabel="New Session"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen text-slate-100 overflow-hidden">
            {shouldShowDisclaimer && (
                <GeocacheDisclaimer onStart={handleStartSession} />
            )}

            {shouldRenderScanner && (
                <FullscreenQrScanner
                    onScan={handleScan}
                    collectedKeyShares={collectedKeyShares}
                    requiredKeyShares={requiredKeyShares}
                    collectedData={collectedData}
                    totalData={totalData}
                    onReset={handleNewSession}
                    isScanning={isScanningActive}
                />
            )}
        </div>
    );
}
