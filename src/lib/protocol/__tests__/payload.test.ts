import { packPayload, unpackPayload } from '@/lib/protocol/payload';
import {
    createTextPayload,
    createFilesPayload,
    createMixedPayload,
    createTestFile,
    arraysEqual,
    randomBytes,
} from '@/lib/__tests__/testUtils';

describe('protocol payload', () => {
    describe('Text payload', () => {
        it('should pack and unpack a simple text payload', async () => {
            const original = createTextPayload('Hello, World!');

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('text');
            if (unpacked.type === 'text') {
                expect(unpacked.content).toBe('Hello, World!');
            }
        });

        it('should handle empty text', async () => {
            const original = createTextPayload('');

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('text');
            if (unpacked.type === 'text') {
                expect(unpacked.content).toBe('');
            }
        });

        it('should handle unicode text', async () => {
            const original = createTextPayload('Hello 世界 🌍 مرحبا');

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('text');
            if (unpacked.type === 'text') {
                expect(unpacked.content).toBe('Hello 世界 🌍 مرحبا');
            }
        });


        it('should handle special characters', async () => {
            const specialText = 'Line 1\nLine 2\tTabbed\r\nWindows\0Null';
            const original = createTextPayload(specialText);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('text');
            if (unpacked.type === 'text') {
                expect(unpacked.content).toBe(specialText);
            }
        });
    });

    describe('Files payload', () => {
        it('should pack and unpack a single file', async () => {
            const original = createFilesPayload([
                createTestFile('test.txt', 'File content'),
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files.length).toBe(1);
                expect(unpacked.files[0].name).toBe('test.txt');
                expect(unpacked.files[0].type).toBe('text/plain');

                const decoder = new TextDecoder();
                expect(decoder.decode(unpacked.files[0].content)).toBe('File content');
            }
        });

        it('should pack and unpack multiple files', async () => {
            const original = createFilesPayload([
                createTestFile('file1.txt', 'Content 1'),
                createTestFile('file2.txt', 'Content 2'),
                createTestFile('file3.txt', 'Content 3'),
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files.length).toBe(3);

                const decoder = new TextDecoder();
                for (let i = 0; i < 3; i++) {
                    expect(unpacked.files[i].name).toBe(`file${i + 1}.txt`);
                    expect(decoder.decode(unpacked.files[i].content)).toBe(`Content ${i + 1}`);
                }
            }
        });

        it('should handle binary file content', async () => {
            const binaryContent = randomBytes(256);
            const encoder = new TextEncoder();

            const original = createFilesPayload([
                {
                    name: 'binary.dat',
                    type: 'application/octet-stream',
                    content: binaryContent,
                },
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files.length).toBe(1);
                expect(unpacked.files[0].name).toBe('binary.dat');
                expect(arraysEqual(unpacked.files[0].content, binaryContent)).toBe(true);
            }
        });


        it('should handle empty file', async () => {
            const original = createFilesPayload([
                createTestFile('empty.txt', ''),
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files[0].content.length).toBe(0);
            }
        });

        it('should handle unicode filenames', async () => {
            const original = createFilesPayload([
                createTestFile('文件.txt', 'Content'),
                createTestFile('файл.txt', 'Content'),
                createTestFile('🎉.txt', 'Content'),
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files[0].name).toBe('文件.txt');
                expect(unpacked.files[1].name).toBe('файл.txt');
                expect(unpacked.files[2].name).toBe('🎉.txt');
            }
        });
    });

    describe('Mixed payload', () => {
        it('should pack and unpack mixed payload with text and files', async () => {
            const original = createMixedPayload(
                'This is the text part',
                [
                    createTestFile('file1.txt', 'File 1 content'),
                    createTestFile('file2.txt', 'File 2 content'),
                ]
            );

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('mixed');
            if (unpacked.type === 'mixed') {
                expect(unpacked.text).toBe('This is the text part');
                expect(unpacked.files.length).toBe(2);

                const decoder = new TextDecoder();
                expect(unpacked.files[0].name).toBe('file1.txt');
                expect(decoder.decode(unpacked.files[0].content)).toBe('File 1 content');
                expect(unpacked.files[1].name).toBe('file2.txt');
                expect(decoder.decode(unpacked.files[1].content)).toBe('File 2 content');
            }
        });

        it('should handle mixed payload with empty text', async () => {
            const original = createMixedPayload(
                '',
                [createTestFile('file.txt', 'Content')]
            );

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('mixed');
            if (unpacked.type === 'mixed') {
                expect(unpacked.text).toBe('');
                expect(unpacked.files.length).toBe(1);
            }
        });

        it('should handle mixed payload with no files', async () => {
            const original = createMixedPayload('Just text', []);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('mixed');
            if (unpacked.type === 'mixed') {
                expect(unpacked.text).toBe('Just text');
                expect(unpacked.files.length).toBe(0);
            }
        });
    });

    describe('Compression', () => {
        it('should compress large repetitive text', async () => {
            const repetitiveText = 'A'.repeat(10 * 1024 * 1024); // 10MB
            const original = createTextPayload(repetitiveText);

            const packed = await packPayload(original);

            // The packed size should be significantly smaller than the original
            // Original is 10MB, compressed should be much less with repetitive data
            const encoder = new TextEncoder();
            const uncompressedSize = encoder.encode(repetitiveText).length;

            expect(packed.length).toBeLessThan(uncompressedSize);
        });

        it('should decompress data correctly after compression', async () => {
            const largePayload = createTextPayload('Test data '.repeat(1000));

            const packed = await packPayload(largePayload);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('text');
            if (unpacked.type === 'text') {
                expect(unpacked.content).toBe('Test data '.repeat(1000));
            }
        });
    });

    describe('Serialization format integrity', () => {
        it('should maintain data integrity through pack/unpack cycle', async () => {
            const payloads = [
                createTextPayload('Simple text'),
                createFilesPayload([createTestFile('test.txt', 'Test')]),
                createMixedPayload('Mixed', [createTestFile('file.txt', 'File')]),
            ];

            for (const original of payloads) {
                const packed = await packPayload(original);
                const unpacked = await unpackPayload(packed);

                expect(unpacked).toEqual(original);
            }
        });

        it('should handle multiple pack/unpack cycles', async () => {
            let payload = createTextPayload('Cycle test');

            for (let i = 0; i < 5; i++) {
                const packed = await packPayload(payload);
                payload = await unpackPayload(packed);
            }

            expect(payload.type).toBe('text');
            if (payload.type === 'text') {
                expect(payload.content).toBe('Cycle test');
            }
        });
    });

    describe('Edge cases', () => {
        it('should handle large files', async () => {
            // Test with 10 files of 10MB each (100MB total)
            const largeFiles = Array.from({ length: 10 }, (_, i) =>
                createTestFile(`file${i}.txt`, 'X'.repeat(10 * 1024 * 1024))
            );

            const original = createFilesPayload(largeFiles);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files.length).toBe(10);
            }
        }, 30000); // 30s timeout for large data test

        it('should handle different MIME types', async () => {
            const encoder = new TextEncoder();
            const original = createFilesPayload([
                {
                    name: 'data.json',
                    type: 'application/json',
                    content: encoder.encode('{"key":"value"}'),
                },
                {
                    name: 'image.png',
                    type: 'image/png',
                    content: randomBytes(100),
                },
                {
                    name: 'doc.pdf',
                    type: 'application/pdf',
                    content: randomBytes(200),
                },
            ]);

            const packed = await packPayload(original);
            const unpacked = await unpackPayload(packed);

            expect(unpacked.type).toBe('files');
            if (unpacked.type === 'files') {
                expect(unpacked.files[0].type).toBe('application/json');
                expect(unpacked.files[1].type).toBe('image/png');
                expect(unpacked.files[2].type).toBe('application/pdf');
            }
        });
    });
});
