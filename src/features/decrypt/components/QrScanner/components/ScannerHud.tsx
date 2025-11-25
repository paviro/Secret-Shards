interface ScannerHudProps {
    collectedShares: number;
    requiredShares: number;
    collectedData: number;
    totalData: number | null;
}

export default function ScannerHud({
    collectedShares,
    requiredShares,
    collectedData,
    totalData
}: ScannerHudProps) {
    // Calculate progress
    const shareProgress = requiredShares > 0 ? (collectedShares / requiredShares) * 100 : 0;
    const dataProgress = totalData ? (collectedData / totalData) * 100 : 0;

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-20 gap-25">
            {/* Static Scanner Overlay (Corners) */}
            <div className="w-88 h-80 relative opacity-75 shrink-0">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl shadow-sm"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl shadow-sm"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl shadow-sm"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl shadow-sm"></div>
            </div>

            {/* Progress Bars Group */}
            <div className="w-full max-w-[22rem] flex gap-4">
                {/* Shares Progress */}
                <div className="flex-1 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/30">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-medium text-white uppercase tracking-wider shadow-black drop-shadow-sm">Shares</span>
                        <span className="text-sm font-bold text-white font-mono drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                            {requiredShares > 0 ? (
                                <>
                                    <span className="text-blue-400">{collectedShares}</span>
                                    <span className="text-slate-400 mx-1">/</span>
                                    <span>{requiredShares}</span>
                                </>
                            ) : (
                                <span className="text-blue-400">{collectedShares}</span>
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(shareProgress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Data Progress */}
                <div className="flex-1 bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/30">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-medium text-white uppercase tracking-wider shadow-black drop-shadow-sm">Data</span>
                        <span className="text-sm font-bold text-white font-mono drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]">
                            {totalData ? (
                                <>
                                    <span className="text-purple-400">{collectedData}</span>
                                    <span className="text-slate-400 mx-1">/</span>
                                    <span>{totalData}</span>
                                </>
                            ) : (
                                <span className="text-purple-400">{collectedData}</span>
                            )}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.8)] transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(dataProgress, 100)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
