import { ShareBlock } from '@/lib/protocol/format';

interface LoadedItemsListProps {
    shares: ShareBlock[];
    dataChunks: Map<number, Uint8Array>;
    totalChunks: number | null;
    dataId: string | null;
    onRemoveShare: (share: ShareBlock) => void;
    onClearData: () => void;
}

export default function LoadedItemsList({ shares, dataChunks, totalChunks, dataId, onRemoveShare, onClearData }: LoadedItemsListProps) {
    return (
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Loaded Items</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {totalChunks !== null && (
                    <div className="flex justify-between items-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <div>
                            <p className="text-xs font-bold text-cyan-400">Encrypted Data</p>
                            <p className="text-[10px] font-mono text-cyan-400/60">
                                {dataId ? dataId.substring(0, 8) : '...'}...
                                ({dataChunks.size}/{totalChunks} chunks)
                            </p>
                        </div>
                        <button onClick={onClearData} className="text-slate-500 hover:text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                {shares.map((share) => (
                    <div key={`${share.id}-${share.shareIndex}`} className="flex justify-between items-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <div>
                            <p className="text-xs font-bold text-indigo-400">Share #{share.shareIndex}</p>
                            <p className="text-[10px] font-mono text-indigo-400/60">{share.id.substring(0, 8)}...</p>
                        </div>
                        <button onClick={() => onRemoveShare(share)} className="text-slate-500 hover:text-red-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                ))}
                {totalChunks === null && shares.length === 0 && (
                    <p className="text-sm text-slate-600 text-center py-4">No items loaded yet</p>
                )}
            </div>
        </div>
    );
}
