'use client';

interface GeocacheDisclaimerProps {
    onStart: () => void;
}

export default function GeocacheDisclaimer({ onStart }: GeocacheDisclaimerProps) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 overflow-hidden text-slate-100">
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-indigo-500/30 rounded-2xl max-w-md p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300 w-full">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">Scanner Mode</h2>
                <p className="text-slate-300 mb-4 leading-relaxed">
                    This mode is made specifically for multi-part secrets found in geocaches or similar outdoor puzzles.
                </p>
                <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-lg p-4 mb-4">
                    <p className="text-indigo-200 text-sm">
                        <strong>Note:</strong> All scanned data is saved to your device&rsquo;s local storage. This ensures you don&rsquo;t lose progress if you close the browser while collecting parts.
                    </p>
                    <p className="text-indigo-200 text-sm mt-2">
                        The data remains on your device until you explicitly start a new session.
                    </p>
                </div>
                <p className="text-slate-300 mb-5 leading-relaxed">
                    For all other use cases, please use the main page.
                </p>
                <button
                    onClick={onStart}
                    className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 rounded-xl transition-colors font-medium"
                >
                    Start Session
                </button>
            </div>
        </div>
    );
}

