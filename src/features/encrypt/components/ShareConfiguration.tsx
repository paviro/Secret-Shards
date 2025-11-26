import { ChangeEvent } from 'react';

interface ShareConfigurationProps {
    shares: number;
    threshold: number;
    onSharesChange: (shares: number) => void;
    onThresholdChange: (threshold: number) => void;
}

// Binary format uses 1 byte for shares and threshold, so max is 255
const MIN_SHARES = 2;
const MAX_SHARES = 255;
const MIN_THRESHOLD = 2;

export default function ShareConfiguration({ shares, threshold, onSharesChange, onThresholdChange }: ShareConfigurationProps) {
    const handleSharesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow empty string (user is deleting to retype)
        if (value === '') {
            onSharesChange(NaN);
            return;
        }

        const num = parseInt(value);
        // Allow the user to type any number, we'll validate at submit time
        onSharesChange(num);
    };

    const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow empty string (user is deleting to retype)
        if (value === '') {
            onThresholdChange(NaN);
            return;
        }

        const num = parseInt(value);
        // Allow the user to type any number, we'll validate at submit time
        onThresholdChange(num);
    };

    // Validation checks
    const sharesValid = !isNaN(shares) && shares >= MIN_SHARES && shares <= MAX_SHARES;
    const thresholdValid = !isNaN(threshold) && threshold >= MIN_THRESHOLD && threshold <= shares;
    const isValid = sharesValid && thresholdValid;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-cyan-300">2. Configure Shares</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="total-shares" className="block text-sm font-medium text-slate-400 mb-2">
                        Total Shares (N)
                        <span className="ml-2 text-xs text-slate-500">How many pieces to create</span>
                    </label>
                    <input
                        id="total-shares"
                        name="totalShares"
                        type="number"
                        min={MIN_SHARES}
                        max={MAX_SHARES}
                        value={isNaN(shares) ? '' : shares}
                        onChange={handleSharesChange}
                        className={`w-full bg-slate-950 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all ${!isNaN(shares) && !sharesValid ? 'border-red-500' : 'border-slate-800'
                            }`}
                    />
                    {isNaN(shares) ? (
                        <p className="mt-1 text-xs text-amber-400">
                            Please enter a value
                        </p>
                    ) : !sharesValid && (
                        <p className="mt-1 text-xs text-red-400">
                            {shares < MIN_SHARES ? `Must be at least ${MIN_SHARES}` : `Must be at most ${MAX_SHARES}`}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="threshold" className="block text-sm font-medium text-slate-400 mb-2">
                        Required Shares (K)
                        <span className="ml-2 text-xs text-slate-500">Minimum needed to unlock</span>
                    </label>
                    <input
                        id="threshold"
                        name="threshold"
                        type="number"
                        min={MIN_THRESHOLD}
                        max={isNaN(shares) ? MAX_SHARES : shares}
                        value={isNaN(threshold) ? '' : threshold}
                        onChange={handleThresholdChange}
                        className={`w-full bg-slate-950 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all ${!isNaN(threshold) && !thresholdValid ? 'border-red-500' : 'border-slate-800'
                            }`}
                    />
                    {isNaN(threshold) ? (
                        <p className="mt-1 text-xs text-amber-400">
                            Please enter a value
                        </p>
                    ) : !thresholdValid && (
                        <p className="mt-1 text-xs text-red-400">
                            {threshold < MIN_THRESHOLD
                                ? `Must be at least ${MIN_THRESHOLD}`
                                : `Must not exceed total shares (${shares})`
                            }
                        </p>
                    )}
                </div>
            </div>
            {isValid && (
                <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800/50">
                    <p className="text-sm text-slate-400 leading-relaxed">
                        <span className="text-cyan-400 font-medium">Summary:</span> You are splitting your secret into <strong>{shares} pieces</strong>.
                        To recover the secret later, you (or your trusted contacts) will need to combine <strong>any {threshold}</strong> of these pieces.
                    </p>
                </div>
            )}
        </div>
    );
}

export function isShareConfigurationValid(shares: number, threshold: number): boolean {
    const sharesValid = !isNaN(shares) && shares >= MIN_SHARES && shares <= MAX_SHARES;
    const thresholdValid = !isNaN(threshold) && threshold >= MIN_THRESHOLD && threshold <= shares;
    return sharesValid && thresholdValid;
}
