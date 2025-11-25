import JSZip from 'jszip';
import ResultCard from '@/components/ResultCard';

interface ResultViewProps {
    result: {
        pdfs: { name: string; url: string }[];
        dataUrl?: string;
        dataName?: string;
        qrImages: { name: string; data: Uint8Array | string }[];
    };
    threshold: number;
    totalShares: number;
    onReset: () => void;
}

export default function ResultView({ result, threshold, totalShares, onReset }: ResultViewProps) {
    const handleDownloadAll = async () => {
        if (!result) return;

        const zip = new JSZip();

        // Add PDFs to shares/pdf/
        for (const pdf of result.pdfs) {
            const response = await fetch(pdf.url);
            const blob = await response.blob();
            zip.file(`shares/pdf/${pdf.name}`, blob);
        }

        // Add Data File to encrypted_data/ if exists
        if (result.dataUrl && result.dataName) {
            const response = await fetch(result.dataUrl);
            const blob = await response.blob();
            zip.file(`encrypted_data/${result.dataName}`, blob);
        }

        // Add QR Code Images (already have correct paths from artifacts.ts)
        for (const qrImage of result.qrImages) {
            if (typeof qrImage.data === 'string') {
                // SVG files are strings
                zip.file(qrImage.name, qrImage.data);
            } else {
                // PNG files are Uint8Array
                zip.file(qrImage.name, qrImage.data);
            }
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
            headerAction={
                <button
                    onClick={handleDownloadAll}
                    className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download All (.zip)
                </button>
            }
        >
            <div className="space-y-6">
                <div>
                    <h3 className="text-base font-medium text-slate-300 mb-1">
                        1. Your Secret Shards to Distribute <span className="text-slate-400 font-normal">(required)</span>
                    </h3>
                    <p className="text-sm text-slate-500 mb-3">These are pieces of your encryption key. Distribute them to different people or locations. Each piece reveals nothing on its own — only when {threshold} out of the {totalShares} pieces are combined do they form the key to unlock the encrypted data below.</p>
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
                        {(() => {
                            const hasDataBlocks = result.qrImages.some(img => img.name.startsWith('encrypted_data/'));
                            return (
                                <>
                                    <h3 className="text-base font-medium text-slate-300 mb-1">
                                        2. Your Encrypted Data <span className="text-slate-400 font-normal">({hasDataBlocks ? 'optional' : 'required'})</span>
                                    </h3>
                                    {hasDataBlocks ? (
                                        <p className="text-sm text-slate-500 mb-3">This is your actual encrypted data — the "locked box" so to speak. Since the data you encrypted is rather small, it's also embedded in the PDFs above, so you don't necessarily need to keep this file.</p>
                                    ) : (
                                        <p className="text-sm text-slate-500 mb-3">This is your actual encrypted data — the "locked box" so to speak. Keep this file secure! You'll need it along with {threshold} pieces of your encryption key to unlock and recover your original data.</p>
                                    )}
                                </>
                            );
                        })()}
                        <a
                            href={result.dataUrl}
                            download={result.dataName}
                            className="inline-flex items-center px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-cyan-300 transition-colors font-medium"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download {result.dataName}
                        </a>
                        <p className="mt-4 text-xs text-slate-500">Note: The zip download also includes PNG and SVG versions of each QR code, allowing you to design your own PDFs or other materials if desired.</p>
                    </div>
                )}
            </div>
        </ResultCard>
    );
}
