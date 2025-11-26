import { DocumentIcon, QrCodeIcon } from '@heroicons/react/24/outline';

export type CapacityStatus = 'empty' | 'waiting' | 'fits' | 'tooLarge';

interface CapacityBadgeProps {
    status: CapacityStatus;
}

export default function CapacityBadge({ status }: CapacityBadgeProps) {
    if (status === 'empty') {
        return null;
    }

    if (status === 'waiting') {
        return (
            <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-200 border border-slate-500/30">
                <span
                    className="h-2 w-2 rounded-full bg-slate-100 animate-pulse"
                    aria-hidden="true"
                />
                Waiting for typing to pause...
            </span>
        );
    }

    if (status === 'fits') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <QrCodeIcon className="h-4 w-4" aria-hidden="true" />
                Embeddable in QR codes
            </span>
        );
    }

    if (status === 'tooLarge') {
        return (
            <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-400/15 text-violet-100 border border-violet-500/30">
                <DocumentIcon className="h-4 w-4 text-violet-200" aria-hidden="true" />
                Separate encrypted file
            </span>
        );
    }

    return null;
}

