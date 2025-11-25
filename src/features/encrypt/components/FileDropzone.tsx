import { useRef, type ChangeEvent } from 'react';
import { useFileDrop } from '@/hooks/useFileDrop';

interface FileDropzoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export default function FileDropzone({ files, onFilesChange }: FileDropzoneProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isDragOver, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useFileDrop({
        onFiles: (newFiles) => {
            onFilesChange([...files, ...newFiles]);
        }
    });

    const handleRemoveFile = (index: number) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        onFilesChange(newFiles);
        if (newFiles.length === 0 && fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFilesChange([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-slate-400 mb-2">Upload Files</label>
            <div
                className="relative group cursor-pointer"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    id="file-select"
                    name="files"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        if (e.target.files && e.target.files.length > 0) {
                            onFilesChange([...files, ...Array.from(e.target.files)]);
                        }
                    }}
                    className="hidden"
                />
                <div className={`w-full p-8 rounded-xl border-2 border-dashed transition-all duration-200 text-center relative overflow-hidden ${isDragOver
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-800'
                    }`}>
                    <div className="flex flex-col items-center gap-3 relative z-10">
                        <div className="p-3 bg-slate-800 rounded-full ring-1 ring-slate-700 shadow-lg group-hover:scale-110 transition-transform duration-200">
                            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-300 group-hover:text-indigo-300 transition-colors">
                                Click to select or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Any file type supported
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-300">{files.length} file{files.length !== 1 ? 's' : ''} selected:</p>
                        <button
                            onClick={handleRemoveAll}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Remove all
                        </button>
                    </div>
                    <ul className={`grid gap-3 ${files.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                        {files.map((f, i) => (
                            <li key={i} className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg group overflow-hidden">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <svg className="w-5 h-5 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-200 truncate">{f.name}</p>
                                        <p className="text-xs text-slate-500">{(f.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveFile(i)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
