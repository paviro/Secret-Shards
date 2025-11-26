import { DataArchive } from '@/lib/protocol/dataArchive';
import ResultCard from '@/components/ResultCard';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ResultViewProps {
    dataArchive: DataArchive;
    onReset: () => void;
    resetLabel?: string;
}

export default function ResultView({ dataArchive, onReset, resetLabel }: ResultViewProps) {
    return (
        <ResultCard
            title="Decryption Successful!"
            onReset={onReset}
            resetLabel={resetLabel || "Decrypt Another Secret"}
        >
            {(dataArchive.type === 'text' || dataArchive.type === 'mixed') && (
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Secret Message:</h3>
                    <p className="text-slate-300 whitespace-pre-wrap break-words font-mono text-sm">
                        {dataArchive.type === 'text' ? dataArchive.content : dataArchive.text}
                    </p>
                </div>
            )}

            {(dataArchive.type === 'files' || dataArchive.type === 'mixed') && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-medium text-slate-300">Decrypted Files:</h3>
                    {dataArchive.files.map((file, i) => {
                        const blob = new Blob([file.content as BlobPart], { type: file.type });
                        const url = URL.createObjectURL(blob);
                        return (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-sm text-slate-200">{file.name}</span>
                                <a
                                    href={url}
                                    download={file.name}
                                    className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                                >
                                    <ArrowDownTrayIcon className="w-4 h-4" stroke="currentColor" strokeWidth={2} />
                                    Download
                                </a>
                            </div>
                        );
                    })}
                </div>
            )}
        </ResultCard>
    );
}
