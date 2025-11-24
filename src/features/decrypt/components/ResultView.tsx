import { Payload } from '@/lib/protocol/payload';
import ResultCard from '@/components/ResultCard';

interface ResultViewProps {
    payload: Payload;
    onReset: () => void;
}

export default function ResultView({ payload, onReset }: ResultViewProps) {
    return (
        <ResultCard
            title="Decryption Successful!"
            onReset={onReset}
            resetLabel="Decrypt Another Secret"
        >
            {(payload.type === 'text' || payload.type === 'mixed') && (
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Secret Message:</h3>
                    <p className="text-slate-300 whitespace-pre-wrap break-words font-mono text-sm">
                        {payload.type === 'text' ? payload.content : payload.text}
                    </p>
                </div>
            )}

            {(payload.type === 'files' || payload.type === 'mixed') && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-medium text-slate-300">Decrypted Files:</h3>
                    {payload.files.map((file, i) => {
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
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
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
