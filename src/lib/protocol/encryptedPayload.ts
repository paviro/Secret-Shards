import { BlockType, MAGIC_BYTES, MAGIC_LENGTH, parseUuid, formatUuid, registerBlockVersion } from './shared';

export const ENCRYPTED_PAYLOAD_VERSION = 0x01;
registerBlockVersion(BlockType.EncryptedPayload, ENCRYPTED_PAYLOAD_VERSION);

export const MAX_DATA_PAGES = 9;

export interface EncryptedPayloadBlock {
    version: number;
    id: string;
    type: BlockType.EncryptedPayload;
    chunkIndex: number;
    totalChunks: number;
    ciphertext: Uint8Array<ArrayBuffer>;
}

export function packEncryptedPayload(
    id: string,
    chunkIndex: number,
    totalChunks: number,
    ciphertext: Uint8Array
): Uint8Array {
    const idBytes = parseUuid(id);
    // Header: Version(1) + ID(16) + Type(1) + Total(1) + Index(1) + Magic(3)
    const buffer = new Uint8Array(MAGIC_LENGTH + 1 + 16 + 1 + 1 + 1 + ciphertext.length);

    let offset = 0;
    buffer.set(MAGIC_BYTES, offset); offset += MAGIC_LENGTH;
    buffer[offset++] = ENCRYPTED_PAYLOAD_VERSION;
    buffer.set(idBytes, offset); offset += 16;
    buffer[offset++] = BlockType.EncryptedPayload;
    buffer[offset++] = totalChunks;
    buffer[offset++] = chunkIndex;

    buffer.set(ciphertext, offset);

    return buffer;
}

export function unpackEncryptedPayload(buffer: Uint8Array): EncryptedPayloadBlock {
    let offset = 0;
    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[offset++] !== MAGIC_BYTES[i]) throw new Error('Invalid encrypted payload magic bytes');
    }

    const version = buffer[offset++];
    if (version !== ENCRYPTED_PAYLOAD_VERSION) throw new Error(`Unsupported encrypted payload version: ${version}`);

    const idBytes = buffer.slice(offset, offset + 16); offset += 16;
    const id = formatUuid(idBytes);

    const type = buffer[offset++];
    if (type !== BlockType.EncryptedPayload) throw new Error(`Invalid block type for encrypted payload: ${type}`);

    const totalChunks = buffer[offset++];
    const chunkIndex = buffer[offset++];

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

export function splitEncryptedPayloads(
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

        // packEncryptedPayload expects 1-based indexing for display usually, but let's stick to 0-based internally
        // or 1-based if that's what we display.
        // Let's use 0-based index for logic, but we can display 1-based.
        // Actually, the plan doesn't specify index base. 0-based is standard for array logic.
        // Let's use 0-based index: 0 to total-1.
        chunks.push(packEncryptedPayload(id, i, totalChunks, chunkData));
    }

    return chunks;
}


