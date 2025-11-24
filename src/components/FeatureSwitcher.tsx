interface FeatureSwitcherProps {
    mode: 'encrypt' | 'decrypt';
    setMode: (mode: 'encrypt' | 'decrypt') => void;
}

export default function FeatureSwitcher({ mode, setMode }: FeatureSwitcherProps) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-1 shadow-2xl mb-8">
            <div className="grid grid-cols-2 gap-1">
                <button
                    onClick={() => setMode('encrypt')}
                    className={`py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${mode === 'encrypt'
                        ? 'bg-slate-800 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    Encrypt & Split
                </button>
                <button
                    onClick={() => setMode('decrypt')}
                    className={`py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${mode === 'decrypt'
                        ? 'bg-slate-800 text-white shadow-lg'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                >
                    Combine & Decrypt
                </button>
            </div>
        </div>
    );
}
