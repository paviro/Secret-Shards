import JSZip from 'jszip';
import ResultCard from '@/components/ResultCard';

interface ResultViewProps {
    result: {
        pdfs: { name: string; url: string }[];
        dataUrl?: string;
        dataName?: string;
    };
    onReset: () => void;
}

export default function ResultView({ result, onReset }: ResultViewProps) {
    const handleDownloadAll = async () => {
        if (!result) return;

        const zip = new JSZip();

        // Add PDFs
        for (const pdf of result.pdfs) {
            const response = await fetch(pdf.url);
            const blob = await response.blob();
            zip.file(pdf.name, blob);
        }

        // Add Data File if exists
        if (result.dataUrl && result.dataName) {
            const response = await fetch(result.dataUrl);
            const blob = await response.blob();
            zip.file(result.dataName, blob);
        }

        // Generate Zip
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'secret-shares.zip';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <ResultCard
            title="Encryption Successful!"
            onReset={onReset}
            resetLabel="Encrypt Another Secret"
        >
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-300">1. Download Shares (Distribute these)</h3>
                        <button
                            onClick={handleDownloadAll}
                            className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download All (.zip)
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {result.pdfs.map((pdf, i) => (
                            <a
                                key={i}
                                href={pdf.url}
                                download={pdf.name}
                                className="flex items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-indigo-300 transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Share {i + 1}
                            </a>
                        ))}
                    </div>
                </div>

                {result.dataUrl && (
                    <div>
                        <h3 className="text-sm font-medium text-slate-300 mb-3">2. Download Encrypted Data (Keep this safe too)</h3>
                        <a
                            href={result.dataUrl}
                            download={result.dataName}
                            className="inline-flex items-center px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-cyan-300 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download {result.dataName}
                        </a>
                        <p className="mt-2 text-xs text-slate-500">
                            Note: This file contains the encrypted payload. For small payloads, it's also included in the QR codes.
                        </p>
                    </div>
                )}
            </div>
        </ResultCard>
    );
}
