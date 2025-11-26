import { useState, useEffect, useCallback } from 'react';
import { KeyShareBlock } from '@/lib/protocol/keyShare';
import { DataArchive } from '@/lib/protocol/dataArchive';

const STORAGE_KEY = 'secrets-sharing-geocache-session';

// Serialization types
type SerializedKeyShareBlock = Omit<KeyShareBlock, 'iv' | 'keyShare'> & {
    iv: string; // Base64
    keyShare: string; // Base64
};

type SerializedFileItem = {
    name: string;
    type: string;
    content: string; // Base64
};

type SerializedDataArchive = 
    | { type: 'text'; content: string }
    | { type: 'files'; files: SerializedFileItem[] }
    | { type: 'mixed'; text: string; files: SerializedFileItem[] };

interface SerializedSession {
    shares: SerializedKeyShareBlock[];
    dataChunks: Array<[number, string]>; // [index, base64_ciphertext]
    totalChunks: number | null;
    dataId: string | null;
    encryptionInfo: { iv: string; algorithm: number } | null;
    decryptedDataArchive: SerializedDataArchive | null;
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
function serializeShare(share: KeyShareBlock): SerializedKeyShareBlock {
    return {
        ...share,
        iv: toBase64(share.iv),
        keyShare: toBase64(share.keyShare)
    };
}

function deserializeShare(s: SerializedKeyShareBlock): KeyShareBlock {
    return {
        ...s,
        iv: fromBase64(s.iv),
        keyShare: fromBase64(s.keyShare)
    };
}

function serializeDataArchive(payload: DataArchive): SerializedDataArchive {
    if (payload.type === 'text') return payload;
    
    const serializeFiles = (files: { name: string; type: string; content: Uint8Array }[]) => 
        files.map(f => ({ ...f, content: toBase64(f.content) }));

    if (payload.type === 'files') {
        return { type: 'files', files: serializeFiles(payload.files) };
    }
    return { type: 'mixed', text: payload.text, files: serializeFiles(payload.files) };
}

function deserializeDataArchive(payload: SerializedDataArchive): DataArchive {
    if (payload.type === 'text') return payload;

    const deserializeFiles = (files: SerializedFileItem[]) => 
        files.map(f => ({ ...f, content: fromBase64(f.content) }));

    if (payload.type === 'files') {
        return { type: 'files', files: deserializeFiles(payload.files) };
    }
    return { type: 'mixed', text: payload.text, files: deserializeFiles(payload.files) };
}

export interface GeocacheStorage {
    shares: KeyShareBlock[];
    dataChunks: Map<number, Uint8Array>;
    totalChunks: number | null;
    dataId: string | null;
    encryptionInfo: { iv: Uint8Array; algorithm: number } | null;
    decryptedDataArchive: DataArchive | null;
    
    saveState: (
        shares: KeyShareBlock[],
        dataChunks: Map<number, Uint8Array>,
        totalChunks: number | null,
        dataId: string | null,
        encryptionInfo: { iv: Uint8Array; algorithm: number } | null,
        decryptedDataArchive: DataArchive | null
    ) => void;
    
    clearSession: () => void;
    isLoaded: boolean;
}

export function useGeocacheStorage(): GeocacheStorage {
    const [isLoaded, setIsLoaded] = useState(false);
    const [shares, setShares] = useState<KeyShareBlock[]>([]);
    const [dataChunks, setDataChunks] = useState<Map<number, Uint8Array>>(new Map());
    const [totalChunks, setTotalChunks] = useState<number | null>(null);
    const [dataId, setDataId] = useState<string | null>(null);
    const [encryptionInfo, setEncryptionInfo] = useState<{ iv: Uint8Array; algorithm: number } | null>(null);
    const [decryptedDataArchive, setDecryptedDataArchive] = useState<DataArchive | null>(null);

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
                
                if (session.decryptedDataArchive) {
                    setDecryptedDataArchive(deserializeDataArchive(session.decryptedDataArchive));
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
        newShares: KeyShareBlock[],
        newDataChunks: Map<number, Uint8Array>,
        newTotalChunks: number | null,
        newDataId: string | null,
        newEncryptionInfo: { iv: Uint8Array; algorithm: number } | null,
        newDecryptedDataArchive: DataArchive | null
    ) => {
        // Update local state first
        setShares(newShares);
        setDataChunks(newDataChunks);
        setTotalChunks(newTotalChunks);
        setDataId(newDataId);
        setEncryptionInfo(newEncryptionInfo);
        setDecryptedDataArchive(newDecryptedDataArchive);

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
                decryptedDataArchive: newDecryptedDataArchive ? serializeDataArchive(newDecryptedDataArchive) : null,
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
        setDecryptedDataArchive(null);
    }, []);

    return {
        shares,
        dataChunks,
        totalChunks,
        dataId,
        encryptionInfo,
        decryptedDataArchive,
        saveState,
        clearSession,
        isLoaded
    };
}

