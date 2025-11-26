import { BlockType, MAGIC_BYTES, MAGIC_LENGTH, parseUuid, formatUuid, registerBlockVersion } from './shared';

export const KEY_SHARE_VERSION = 0x01;
registerBlockVersion(BlockType.KeyShare, KEY_SHARE_VERSION);

export enum Algorithm {
    AES_GCM_256 = 0x01,
}

export interface KeyShareBlock {
    version: number;
    id: string;
    type: BlockType.KeyShare;
    threshold: number;
    totalShares: number;
    shareIndex: number;
    algorithm: Algorithm;
    iv: Uint8Array<ArrayBuffer>;
    keyShare: Uint8Array<ArrayBuffer>;
}

// Max share size (16KB is generous for 256-bit keys + metadata)
const MAX_KEY_SHARE_SIZE = 16 * 1024;

export function packKeyShare(
    id: string,
    threshold: number,
    totalShares: number,
    shareIndex: number,
    keyShare: Uint8Array,
    iv: Uint8Array,
    algorithm: Algorithm = Algorithm.AES_GCM_256
): Uint8Array {
    const idBytes = parseUuid(id);

    if (algorithm === Algorithm.AES_GCM_256 && iv.length !== 12) {
        throw new Error('IV must be 12 bytes for AES-GCM');
    }

    // Magic(3) + Ver(1) + ID(16) + Type(1) + Thr(1) + Tot(1) + Idx(1) + Alg(1) + IV(12) + KeyShare(var)
    const buffer = new Uint8Array(MAGIC_LENGTH + 1 + 16 + 1 + 1 + 1 + 1 + 1 + iv.length + keyShare.length);

    let offset = 0;
    buffer.set(MAGIC_BYTES, offset); offset += MAGIC_LENGTH;
    buffer[offset++] = KEY_SHARE_VERSION;
    buffer.set(idBytes, offset); offset += 16;
    buffer[offset++] = BlockType.KeyShare;
    buffer[offset++] = threshold;
    buffer[offset++] = totalShares;
    buffer[offset++] = shareIndex;
    buffer[offset++] = algorithm;
    buffer.set(iv, offset); offset += iv.length;
    buffer.set(keyShare, offset);

    return buffer;
}

export function unpackKeyShare(buffer: Uint8Array): KeyShareBlock {
    if (buffer.byteLength > MAX_KEY_SHARE_SIZE) {
        throw new Error(`Key share too large: ${buffer.byteLength} bytes. Max allowed is ${MAX_KEY_SHARE_SIZE} bytes.`);
    }

    let offset = 0;
    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[offset++] !== MAGIC_BYTES[i]) throw new Error('Invalid key share magic bytes');
    }

    const version = buffer[offset++];
    if (version !== KEY_SHARE_VERSION) throw new Error(`Unsupported key share version: ${version}`);

    const idBytes = buffer.slice(offset, offset + 16); offset += 16;
    const id = formatUuid(idBytes);

    const type = buffer[offset++];
    if (type !== BlockType.KeyShare) throw new Error(`Invalid block type for key share: ${type}`);

    const threshold = buffer[offset++];
    const totalShares = buffer[offset++];
    const shareIndex = buffer[offset++];
    const algorithm = buffer[offset++];

    let iv: Uint8Array;
    if (algorithm === Algorithm.AES_GCM_256) {
        iv = buffer.slice(offset, offset + 12);
        offset += 12;
    } else {
        // For future algos, we might handle this differently
        // For now, assume 12 bytes or throw
        throw new Error(`Unsupported algorithm in share: ${algorithm}`);
    }

    const keyShare = buffer.slice(offset) as Uint8Array<ArrayBuffer>;

    return {
        version,
        id,
        type,
        threshold,
        totalShares,
        shareIndex,
        algorithm,
        iv: iv as Uint8Array<ArrayBuffer>,
        keyShare,
    };
}

