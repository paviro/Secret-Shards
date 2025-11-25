'use client';

import { isLegalPagesEnabled } from '@/lib/config';
import Link from 'next/link';

export default function Footer() {
    const legalPagesEnabled = isLegalPagesEnabled();

    if (!legalPagesEnabled) {
        return <div className="pb-5" />;
    }

    return (
        <footer className="mt-16 pb-8 text-center">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-slate-500">
                    <a
                        href="https://github.com/paviro/Secret-Shards"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Source Code
                    </a>

                    <span className="text-slate-700">•</span>
                    <Link
                        href="/legal/"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Legal Disclosure
                    </Link>

                    <span className="text-slate-700">•</span>
                    <Link
                        href="/privacy/"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}
