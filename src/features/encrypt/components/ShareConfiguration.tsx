import { ChangeEvent } from 'react';

interface ShareConfigurationProps {
    shares: number;
    threshold: number;
    onSharesChange: (shares: number) => void;
    onThresholdChange: (threshold: number) => void;
}

export default function ShareConfiguration({ shares, threshold, onSharesChange, onThresholdChange }: ShareConfigurationProps) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-cyan-300">2. Configure Shares</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="total-shares" className="block text-sm font-medium text-slate-400 mb-2">
                        Total Shares (N)
                        <span className="ml-2 text-xs text-slate-500">How many keys to generate</span>
                    </label>
                    <input
                        id="total-shares"
                        name="totalShares"
                        type="number"
                        min={2}
                        max={255}
                        value={shares}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onSharesChange(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label htmlFor="threshold" className="block text-sm font-medium text-slate-400 mb-2">
                        Threshold (K)
                        <span className="ml-2 text-xs text-slate-500">Minimum needed to decrypt</span>
                    </label>
                    <input
                        id="threshold"
                        name="threshold"
                        type="number"
                        min={2}
                        max={shares}
                        value={threshold}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onThresholdChange(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                    />
                </div>
            </div>
            <p className="mt-4 text-sm text-slate-500">
                You will generate <strong>{shares}</strong> shares. Any <strong>{threshold}</strong> of them will be needed to recover the secret.
            </p>
        </div>
    );
}
