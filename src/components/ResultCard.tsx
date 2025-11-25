import type { ReactNode } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

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
                    <CheckCircleIcon className="w-6 h-6" stroke="currentColor" strokeWidth={2} />
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
