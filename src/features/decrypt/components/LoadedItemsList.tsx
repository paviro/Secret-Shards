import { KeyShareBlock } from '@/lib/protocol/keyShare';
import { TrashIcon } from '@heroicons/react/24/outline';

interface LoadedItemsListProps {
    keyShares: KeyShareBlock[];
    dataChunks: Map<number, Uint8Array>;
    totalChunks: number | null;
    dataId: string | null;
    onRemoveKeyShare: (share: KeyShareBlock) => void;
    onClearData: () => void;
}

export default function LoadedItemsList({ keyShares, dataChunks, totalChunks, dataId, onRemoveKeyShare, onClearData }: LoadedItemsListProps) {
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
                        <button onClick={onClearData} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all">
                            <TrashIcon className="w-4 h-4" stroke="currentColor" strokeWidth={2} />
                        </button>
                    </div>
                )}
                {keyShares.map((share) => (
                    <div key={`${share.id}-${share.shareIndex}`} className="flex justify-between items-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <div>
                            <p className="text-xs font-bold text-indigo-400">Share #{share.shareIndex}</p>
                            <p className="text-[10px] font-mono text-indigo-400/60">{share.id.substring(0, 8)}...</p>
                        </div>
                        <button onClick={() => onRemoveKeyShare(share)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-all">
                            <TrashIcon className="w-4 h-4" stroke="currentColor" strokeWidth={2} />
                        </button>
                    </div>
                ))}
                {totalChunks === null && keyShares.length === 0 && (
                    <p className="text-sm text-slate-600 text-center py-4">No items loaded yet</p>
                )}
            </div>
        </div>
    );
}
