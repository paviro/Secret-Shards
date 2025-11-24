import { useState } from 'react';
import QrScanner from './QrScanner';
import { useFileDrop } from '@/hooks/useFileDrop';

interface InputZoneProps {
    onScan: (text: string) => void;
    onFiles: (files: FileList) => void;
    onPaste: (text: string) => void;
    isProcessing: boolean;
}

export default function InputZone({ onScan, onFiles, onPaste, isProcessing }: InputZoneProps) {
    const [scanning, setScanning] = useState(false);

    const { isDragOver, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileDrop({
        onFiles: (files) => {
            // Convert Array<File> back to FileList-like object or just pass the array if onFiles supports it.
            // Since onFiles expects FileList, we can create a DataTransfer to simulate it or update onFiles signature.
            // For now let's create a DataTransfer to keep props compatible.
            const dt = new DataTransfer();
            files.forEach(f => dt.items.add(f));
            onFiles(dt.files);
        }
    });

    return (
        <>
            {scanning && (
                <div className="mb-8">
                    <QrScanner
                        onScan={(text) => {
                            onScan(text);
                            setScanning(false);
                        }}
                        onClose={() => setScanning(false)}
                    />
                </div>
            )}

            <div
                className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-xl text-center relative overflow-hidden mb-8"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <div className={`absolute inset-0 bg-indigo-500/5 transition-opacity pointer-events-none ${isDragOver ? 'opacity-100' : 'opacity-0'}`} />

                <div className="space-y-6 relative z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-800 rounded-full ring-1 ring-slate-700 shadow-lg">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-200">
                            Drop files, paste text, or scan QR
                        </h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            Drag and drop your PDF shares, images of QR codes, or encrypted data files here. We'll figure out what they are.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <button
                            onClick={() => setScanning(true)}
                            className="py-3 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            Scan QR Code
                        </button>

                        <div className="relative group">
                            <label htmlFor="file-select" className="sr-only">Select Files</label>
                            <input
                                id="file-select"
                                name="fileSelect"
                                type="file"
                                multiple
                                disabled={isProcessing}
                                onChange={(e) => {
                                    if (e.target.files) {
                                        onFiles(e.target.files);
                                    }
                                    e.currentTarget.value = '';
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            />
                            <button className="w-full h-full py-3 px-4 bg-slate-800 group-hover:bg-slate-700 border border-slate-700 group-hover:border-slate-600 text-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Select Files
                            </button>
                        </div>

                        <div className="relative group/paste">
                            <label htmlFor="paste-text" className="sr-only">Paste Text</label>
                            <input
                                id="paste-text"
                                name="pasteText"
                                type="text"
                                placeholder="Paste text..."
                                className="w-full py-3 px-4 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-center placeholder:text-slate-600"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = e.currentTarget.value;
                                        if (val.trim()) {
                                            onPaste(val);
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
