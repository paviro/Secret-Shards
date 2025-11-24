export const VERSION = 0x01;
const MAGIC_BYTES = new Uint8Array([0x53, 0x48, 0x44]); // "SHD" (Secret Sharing Data)
const MAGIC_LENGTH = MAGIC_BYTES.length;
export const MAX_DATA_PAGES = 9;

export enum BlockType {
    Share = 0x01,
    Data = 0x02,
}

export enum Algorithm {
    AES_GCM_256 = 0x01,
}

// Helper to parse UUID string to 16 bytes
function parseUuid(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// Helper to format 16 bytes to UUID string
function formatUuid(bytes: Uint8Array): string {
    const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32),
    ].join('-');
}

export interface ShareBlock {
    version: number;
    id: string;
    type: BlockType.Share;
    threshold: number;
    totalShares: number;
    shareIndex: number;
    algorithm: Algorithm;
    iv: Uint8Array<ArrayBuffer>;
    keyShare: Uint8Array<ArrayBuffer>;
}

// Max share size (16KB is generous for 256-bit keys + metadata)
const MAX_SHARE_SIZE = 16 * 1024;

export interface DataBlock {
    version: number;
    id: string;
    type: BlockType.Data;
    chunkIndex: number;
    totalChunks: number;
    ciphertext: Uint8Array<ArrayBuffer>;
}

export function packShare(
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
    buffer[offset++] = VERSION;
    buffer.set(idBytes, offset); offset += 16;
    buffer[offset++] = BlockType.Share;
    buffer[offset++] = threshold;
    buffer[offset++] = totalShares;
    buffer[offset++] = shareIndex;
    buffer[offset++] = algorithm;
    buffer.set(iv, offset); offset += iv.length;
    buffer.set(keyShare, offset);

    return buffer;
}

export function unpackShare(buffer: Uint8Array): ShareBlock {
    if (buffer.byteLength > MAX_SHARE_SIZE) {
        throw new Error(`Share too large: ${buffer.byteLength} bytes. Max allowed is ${MAX_SHARE_SIZE} bytes.`);
    }

    let offset = 0;
    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[offset++] !== MAGIC_BYTES[i]) throw new Error('Invalid share magic bytes');
    }

    const version = buffer[offset++];
    if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);

    const idBytes = buffer.slice(offset, offset + 16); offset += 16;
    const id = formatUuid(idBytes);

    const type = buffer[offset++];
    if (type !== BlockType.Share) throw new Error(`Invalid block type for share: ${type}`);

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

export function packData(
    id: string,
    chunkIndex: number,
    totalChunks: number,
    ciphertext: Uint8Array
): Uint8Array {
    const idBytes = parseUuid(id);
    // Header: Version(1) + ID(16) + Type(1) + Index(1) + Total(1) = 20 bytes + Magic(3)
    const buffer = new Uint8Array(MAGIC_LENGTH + 20 + ciphertext.length);

    let offset = 0;
    buffer.set(MAGIC_BYTES, offset); offset += MAGIC_LENGTH;
    buffer[offset++] = VERSION;
    buffer.set(idBytes, offset); offset += 16;
    buffer[offset++] = BlockType.Data;
    buffer[offset++] = chunkIndex;
    buffer[offset++] = totalChunks;

    buffer.set(ciphertext, offset);

    return buffer;
}

export function unpackData(buffer: Uint8Array): DataBlock {
    let offset = 0;
    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[offset++] !== MAGIC_BYTES[i]) throw new Error('Invalid data magic bytes');
    }

    const version = buffer[offset++];
    if (version !== VERSION) throw new Error(`Unsupported version: ${version}`);

    const idBytes = buffer.slice(offset, offset + 16); offset += 16;
    const id = formatUuid(idBytes);

    const type = buffer[offset++];
    if (type !== BlockType.Data) throw new Error(`Invalid block type for data: ${type}`);

    const chunkIndex = buffer[offset++];
    const totalChunks = buffer[offset++];

    const ciphertext = buffer.slice(offset) as Uint8Array<ArrayBuffer>;

    return {
        version,
        id,
        type,
        chunkIndex,
        totalChunks,
        ciphertext,
    };
}

export function splitData(
    id: string,
    ciphertext: Uint8Array,
    maxChunkSize: number
): Uint8Array[] {
    const chunks: Uint8Array[] = [];
    const totalChunks = Math.ceil(ciphertext.length / maxChunkSize);

    if (totalChunks > MAX_DATA_PAGES) {
        throw new Error(`Data too large: requires ${totalChunks} pages, max allowed is ${MAX_DATA_PAGES}`);
    }

    for (let i = 0; i < totalChunks; i++) {
        const start = i * maxChunkSize;
        const end = Math.min(start + maxChunkSize, ciphertext.length);
        const chunkData = ciphertext.slice(start, end);
        
        // packData expects 1-based indexing for display usually, but let's stick to 0-based internally 
        // or 1-based if that's what we display. 
        // Let's use 0-based index for logic, but we can display 1-based.
        // Actually, the plan doesn't specify index base. 0-based is standard for array logic.
        // Let's use 0-based index: 0 to total-1.
        chunks.push(packData(id, i, totalChunks, chunkData));
    }

    return chunks;
}

export function identifyBlockType(buffer: Uint8Array): BlockType {
    // Check version first
    if (buffer.length < MAGIC_LENGTH + 1 + 16 + 1) {
        throw new Error('Buffer too small to identify block type');
    }

    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[i] !== MAGIC_BYTES[i]) {
            throw new Error('Invalid magic bytes');
        }
    }

    if (buffer[MAGIC_LENGTH] !== VERSION) throw new Error(`Unsupported version: ${buffer[MAGIC_LENGTH]}`);
    // Type is after magic + version + 16-byte ID
    return buffer[MAGIC_LENGTH + 1 + 16] as BlockType;
}
