export const MAGIC_BYTES = new Uint8Array([0x53, 0x48, 0x44]); // "SHD" (Secret Sharing Data)
export const MAGIC_LENGTH = MAGIC_BYTES.length;

export enum BlockType {
    KeyShare = 0x01,
    EncryptedPayload = 0x02,
}

const KNOWN_VERSIONS = new Map<BlockType, Set<number>>();

export function registerBlockVersion(type: BlockType, version: number) {
    if (!KNOWN_VERSIONS.has(type)) {
        KNOWN_VERSIONS.set(type, new Set());
    }
    KNOWN_VERSIONS.get(type)!.add(version);
}

// Helper to parse UUID string to 16 bytes
export function parseUuid(uuid: string): Uint8Array {
    const hex = uuid.replace(/-/g, '');
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

// Helper to format 16 bytes to UUID string
export function formatUuid(bytes: Uint8Array): string {
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

export function identifyBlockType(buffer: Uint8Array): BlockType {
    if (buffer.length < MAGIC_LENGTH + 1 + 16 + 1) {
        throw new Error('Buffer too small to identify block type');
    }

    for (let i = 0; i < MAGIC_LENGTH; i++) {
        if (buffer[i] !== MAGIC_BYTES[i]) {
            throw new Error('Invalid magic bytes');
        }
    }

    const version = buffer[MAGIC_LENGTH];

    // Type is after magic + version + 16-byte ID
    const typeOffset = MAGIC_LENGTH + 1 + 16;
    const typeValue = buffer[typeOffset];
    if (typeValue !== BlockType.KeyShare && typeValue !== BlockType.EncryptedPayload) {
        throw new Error(`Unknown block type: ${typeValue}`);
    }
    const type = typeValue as BlockType;

    const versionsForType = KNOWN_VERSIONS.get(type);
    if (!versionsForType || !versionsForType.has(version)) {
        throw new Error(`Unsupported version ${version} for block type ${BlockType[type] ?? type}`);
    }

    return type;
}

