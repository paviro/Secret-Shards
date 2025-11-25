import { useState, useEffect, useCallback } from 'react';
import { ShareBlock } from '@/lib/protocol/format';
import { Payload } from '@/lib/protocol/payload';

const STORAGE_KEY = 'secrets-sharing-geocache-session';

// Serialization types
type SerializedShareBlock = Omit<ShareBlock, 'iv' | 'keyShare'> & {
    iv: string; // Base64
    keyShare: string; // Base64
};

type SerializedFileItem = {
    name: string;
    type: string;
    content: string; // Base64
};

type SerializedPayload = 
    | { type: 'text'; content: string }
    | { type: 'files'; files: SerializedFileItem[] }
    | { type: 'mixed'; text: string; files: SerializedFileItem[] };

interface SerializedSession {
    shares: SerializedShareBlock[];
    dataChunks: Array<[number, string]>; // [index, base64_ciphertext]
    totalChunks: number | null;
    dataId: string | null;
    encryptionInfo: { iv: string; algorithm: number } | null;
    decryptedPayload: SerializedPayload | null;
    lastUpdated: number;
}

// Base64 helpers
function toBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes as Uint8Array<ArrayBuffer>;
}

// Serialization helpers
function serializeShare(share: ShareBlock): SerializedShareBlock {
    return {
        ...share,
        iv: toBase64(share.iv),
        keyShare: toBase64(share.keyShare)
    };
}

function deserializeShare(s: SerializedShareBlock): ShareBlock {
    return {
        ...s,
        iv: fromBase64(s.iv),
        keyShare: fromBase64(s.keyShare)
    };
}

function serializePayload(payload: Payload): SerializedPayload {
    if (payload.type === 'text') return payload;
    
    const serializeFiles = (files: { name: string; type: string; content: Uint8Array }[]) => 
        files.map(f => ({ ...f, content: toBase64(f.content) }));

    if (payload.type === 'files') {
        return { type: 'files', files: serializeFiles(payload.files) };
    }
    return { type: 'mixed', text: payload.text, files: serializeFiles(payload.files) };
}

function deserializePayload(payload: SerializedPayload): Payload {
    if (payload.type === 'text') return payload;

    const deserializeFiles = (files: SerializedFileItem[]) => 
        files.map(f => ({ ...f, content: fromBase64(f.content) }));

    if (payload.type === 'files') {
        return { type: 'files', files: deserializeFiles(payload.files) };
    }
    return { type: 'mixed', text: payload.text, files: deserializeFiles(payload.files) };
}

export interface GeocacheStorage {
    shares: ShareBlock[];
    dataChunks: Map<number, Uint8Array>;
    totalChunks: number | null;
    dataId: string | null;
    encryptionInfo: { iv: Uint8Array; algorithm: number } | null;
    decryptedPayload: Payload | null;
    
    saveState: (
        shares: ShareBlock[],
        dataChunks: Map<number, Uint8Array>,
        totalChunks: number | null,
        dataId: string | null,
        encryptionInfo: { iv: Uint8Array; algorithm: number } | null,
        decryptedPayload: Payload | null
    ) => void;
    
    clearSession: () => void;
    isLoaded: boolean;
}

export function useGeocacheStorage(): GeocacheStorage {
    const [isLoaded, setIsLoaded] = useState(false);
    const [shares, setShares] = useState<ShareBlock[]>([]);
    const [dataChunks, setDataChunks] = useState<Map<number, Uint8Array>>(new Map());
    const [totalChunks, setTotalChunks] = useState<number | null>(null);
    const [dataId, setDataId] = useState<string | null>(null);
    const [encryptionInfo, setEncryptionInfo] = useState<{ iv: Uint8Array; algorithm: number } | null>(null);
    const [decryptedPayload, setDecryptedPayload] = useState<Payload | null>(null);

    // Load from storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const session: SerializedSession = JSON.parse(stored);
                
                setShares(session.shares.map(deserializeShare));
                setDataChunks(new Map(session.dataChunks.map(([k, v]) => [k, fromBase64(v)])));
                setTotalChunks(session.totalChunks);
                setDataId(session.dataId);
                
                if (session.encryptionInfo) {
                    setEncryptionInfo({
                        iv: fromBase64(session.encryptionInfo.iv),
                        algorithm: session.encryptionInfo.algorithm
                    });
                }
                
                if (session.decryptedPayload) {
                    setDecryptedPayload(deserializePayload(session.decryptedPayload));
                }
            }
        } catch (e) {
            console.error('Failed to load geocache session:', e);
            // On error, clear corrupted storage
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const saveState = useCallback((
        newShares: ShareBlock[],
        newDataChunks: Map<number, Uint8Array>,
        newTotalChunks: number | null,
        newDataId: string | null,
        newEncryptionInfo: { iv: Uint8Array; algorithm: number } | null,
        newDecryptedPayload: Payload | null
    ) => {
        // Update local state first
        setShares(newShares);
        setDataChunks(newDataChunks);
        setTotalChunks(newTotalChunks);
        setDataId(newDataId);
        setEncryptionInfo(newEncryptionInfo);
        setDecryptedPayload(newDecryptedPayload);

        // Then persist
        try {
            const session: SerializedSession = {
                shares: newShares.map(serializeShare),
                dataChunks: Array.from(newDataChunks.entries()).map(([k, v]) => [k, toBase64(v)]),
                totalChunks: newTotalChunks,
                dataId: newDataId,
                encryptionInfo: newEncryptionInfo ? {
                    iv: toBase64(newEncryptionInfo.iv),
                    algorithm: newEncryptionInfo.algorithm
                } : null,
                decryptedPayload: newDecryptedPayload ? serializePayload(newDecryptedPayload) : null,
                lastUpdated: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
            console.error('Failed to save geocache session:', e);
        }
    }, []);

    const clearSession = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setShares([]);
        setDataChunks(new Map());
        setTotalChunks(null);
        setDataId(null);
        setEncryptionInfo(null);
        setDecryptedPayload(null);
    }, []);

    return {
        shares,
        dataChunks,
        totalChunks,
        dataId,
        encryptionInfo,
        decryptedPayload,
        saveState,
        clearSession,
        isLoaded
    };
}

