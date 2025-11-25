import type { ReactNode } from 'react';

interface ResultCardProps {
    title: string;
    onReset: () => void;
    resetLabel?: string;
    children: ReactNode;
    headerAction?: ReactNode;
}

export default function ResultCard({ title, onReset, resetLabel = "Start Over", children, headerAction }: ResultCardProps) {
    return (
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {title}
                </h2>
                {headerAction}
            </div>

            {children}

            <button
                onClick={onReset}
                className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl transition-colors font-medium mt-6"
            >
                {resetLabel}
            </button>
        </div>
    );
}
