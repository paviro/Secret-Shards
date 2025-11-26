import type { FileItem, Payload } from '@/lib/protocol/payload';

/**
 * Test utilities for generating mock data and comparing Uint8Arrays
 */

/**
 * Generate random bytes for testing
 */
export function randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
}

/**
 * Create a test file item
 */
export function createTestFile(name: string, content: string): FileItem {
    const encoder = new TextEncoder();
    return {
        name,
        type: 'text/plain',
        content: encoder.encode(content),
    };
}

/**
 * Create a test text payload
 */
export function createTextPayload(text: string): Payload {
    return {
        type: 'text',
        content: text,
    };
}

/**
 * Create a test files payload
 */
export function createFilesPayload(files: FileItem[]): Payload {
    return {
        type: 'files',
        files,
    };
}

/**
 * Create a test mixed payload
 */
export function createMixedPayload(text: string, files: FileItem[]): Payload {
    return {
        type: 'mixed',
        text,
        files,
    };
}

/**
 * Compare two Uint8Arrays for equality
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Convert Uint8Array to hex string for debugging
 */
export function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
