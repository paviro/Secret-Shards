
export type FileItem = { name: string; type: string; content: Uint8Array };

export type Payload =
    | { type: 'text'; content: string }
    | { type: 'files'; files: FileItem[] }
    | { type: 'mixed'; text: string; files: FileItem[] };

// --- Payload framing bytes (header) ---
const PAYLOAD_VERSION = 0x01; // Increments whenever the binary layout changes
const COMPRESSION_NONE = 0x00;
const COMPRESSION_GZIP = 0x01;
const HEADER_SIZE = 1 /* version */ + 1 /* compression id */;

// --- Body type discriminator values (first byte inside body) ---
const TYPE_TEXT = 0x01;
const TYPE_FILES = 0x02;
const TYPE_MIXED = 0x03;

// Helper to encode string to bytes
function encodeString(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}

// Helper to decode bytes to string
function decodeString(bytes: Uint8Array): string {
    return new TextDecoder().decode(bytes);
}

// Helper to write 32-bit integer (Little Endian)
function writeUint32LE(value: number, buffer: Uint8Array, offset: number) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
    buffer[offset + 2] = (value >> 16) & 0xff;
    buffer[offset + 3] = (value >> 24) & 0xff;
}

// Helper to read 32-bit integer (Little Endian)
function readUint32LE(buffer: Uint8Array, offset: number): number {
    return (
        buffer[offset] |
        (buffer[offset + 1] << 8) |
        (buffer[offset + 2] << 16) |
        (buffer[offset + 3] << 24)
    );
}

// Helper to write 16-bit integer (Little Endian)
function writeUint16LE(value: number, buffer: Uint8Array, offset: number) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >> 8) & 0xff;
}

// Helper to read 16-bit integer (Little Endian)
function readUint16LE(buffer: Uint8Array, offset: number): number {
    return buffer[offset] | (buffer[offset + 1] << 8);
}

async function compress(data: Uint8Array): Promise<Uint8Array> {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(data as unknown as BufferSource);
    writer.close();
    const response = new Response(stream.readable);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(data as unknown as BufferSource);
    writer.close();
    const response = new Response(stream.readable);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

function calculateFilesSize(files: FileItem[]): number {
    let size = 0;
    for (const file of files) {
        const nameBytes = encodeString(file.name);
        const typeBytes = encodeString(file.type);
        // NameLen(2) + Name + TypeLen(1) + Type + ContentLen(4) + Content
        size += 2 + nameBytes.length + 1 + typeBytes.length + 4 + file.content.length;
    }
    return size;
}

function writeFiles(files: FileItem[], buffer: Uint8Array, offset: number): number {
    let currentOffset = offset;
    for (const file of files) {
        const nameBytes = encodeString(file.name);
        const typeBytes = encodeString(file.type);

        writeUint16LE(nameBytes.length, buffer, currentOffset);
        currentOffset += 2;

        buffer.set(nameBytes, currentOffset);
        currentOffset += nameBytes.length;

        buffer[currentOffset++] = typeBytes.length;
        buffer.set(typeBytes, currentOffset);
        currentOffset += typeBytes.length;

        writeUint32LE(file.content.length, buffer, currentOffset);
        currentOffset += 4;

        buffer.set(file.content, currentOffset);
        currentOffset += file.content.length;
    }
    return currentOffset;
}

function readFiles(buffer: Uint8Array, offset: number, count: number): { files: FileItem[], newOffset: number } {
    const files: FileItem[] = [];
    let currentOffset = offset;

    for (let i = 0; i < count; i++) {
        const nameLen = readUint16LE(buffer, currentOffset);
        currentOffset += 2;

        const name = decodeString(buffer.slice(currentOffset, currentOffset + nameLen));
        currentOffset += nameLen;

        const typeLen = buffer[currentOffset++];
        const fileType = decodeString(buffer.slice(currentOffset, currentOffset + typeLen));
        currentOffset += typeLen;

        const contentLen = readUint32LE(buffer, currentOffset);
        currentOffset += 4;

        const content = buffer.slice(currentOffset, currentOffset + contentLen);
        currentOffset += contentLen;

        files.push({ name, type: fileType, content });
    }

    return { files, newOffset: currentOffset };
}

function serializePayload(payload: Payload): Uint8Array {
    if (payload.type === 'text') {
        const textBytes = encodeString(payload.content);
        const buffer = new Uint8Array(1 + textBytes.length);
        buffer[0] = TYPE_TEXT;
        buffer.set(textBytes, 1);
        return buffer;
    } else if (payload.type === 'files') {
        const filesSize = calculateFilesSize(payload.files);
        const buffer = new Uint8Array(1 + 1 + filesSize); // Type + Count + Files
        let offset = 0;

        buffer[offset++] = TYPE_FILES;
        buffer[offset++] = payload.files.length;

        writeFiles(payload.files, buffer, offset);
        return buffer;
    } else {
        // Mixed
        const textBytes = encodeString(payload.text);
        const filesSize = calculateFilesSize(payload.files);
        // Type + TextLen(4) + Text + FileCount(1) + Files
        const totalSize = 1 + 4 + textBytes.length + 1 + filesSize;
        const buffer = new Uint8Array(totalSize);
        let offset = 0;

        buffer[offset++] = TYPE_MIXED;

        writeUint32LE(textBytes.length, buffer, offset);
        offset += 4;

        buffer.set(textBytes, offset);
        offset += textBytes.length;

        buffer[offset++] = payload.files.length;

        writeFiles(payload.files, buffer, offset);
        return buffer;
    }
}

function deserializePayload(buffer: Uint8Array): Payload {
    const type = buffer[0];

    if (type === TYPE_TEXT) {
        const content = decodeString(buffer.slice(1));
        return { type: 'text', content };
    } else if (type === TYPE_FILES) {
        const count = buffer[1];
        const { files } = readFiles(buffer, 2, count);
        return { type: 'files', files };
    } else if (type === TYPE_MIXED) {
        let offset = 1;

        const textLen = readUint32LE(buffer, offset);
        offset += 4;

        const text = decodeString(buffer.slice(offset, offset + textLen));
        offset += textLen;

        const fileCount = buffer[offset++];
        const { files } = readFiles(buffer, offset, fileCount);

        return { type: 'mixed', text, files };
    } else {
        throw new Error(`Unknown payload type: ${type}`);
    }
}

export async function packPayload(payload: Payload): Promise<Uint8Array> {
    const rawData = serializePayload(payload);

    // Try compressing
    let body: Uint8Array;
    let compressionAlgorithm = COMPRESSION_NONE;

    try {
        const compressedData = await compress(rawData);
        // Only use compressed if it's smaller
        if (compressedData.length < rawData.length) {
            body = compressedData;
            compressionAlgorithm = COMPRESSION_GZIP;
        } else {
            body = rawData;
        }
    } catch (e) {
        console.warn('Compression failed, using raw data', e);
        body = rawData;
    }

    const result = new Uint8Array(HEADER_SIZE + body.length);

    let offset = 0;
    result[offset++] = PAYLOAD_VERSION;
    result[offset++] = compressionAlgorithm;

    result.set(body, offset);

    return result;
}

export async function unpackPayload(buffer: Uint8Array): Promise<Payload> {
    if (buffer.length < HEADER_SIZE) {
        throw new Error('Payload buffer too small to contain header');
    }

    let offset = 0;
    const version = buffer[offset++];
    if (version !== PAYLOAD_VERSION) {
        throw new Error(`Unsupported payload version: ${version}`);
    }

    const compressionAlgorithm = buffer[offset++];
    
    const body = buffer.slice(offset);

    let rawData: Uint8Array;

    if (compressionAlgorithm === COMPRESSION_NONE) {
        rawData = body;
    } else if (compressionAlgorithm === COMPRESSION_GZIP) {
        rawData = await decompress(body);
    } else {
        throw new Error(`Unsupported compression algorithm: 0x${compressionAlgorithm.toString(16).padStart(2, '0')}`);
    }

    return deserializePayload(rawData);
}
