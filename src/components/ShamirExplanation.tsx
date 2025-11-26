import React from 'react';

interface ShamirExplanationProps {
    onClose?: () => void;
    className?: string;
}

export default function ShamirExplanation({ onClose, className = '' }: ShamirExplanationProps) {
    return (
        <div className={`space-y-4 ${className}`}>
            <p className="text-slate-300 leading-relaxed">
                Shamir&apos;s Secret Sharing secures your data by splitting it into multiple parts, or &quot;shares&quot;. Unlike a puzzle piece which shows part of the picture, a single share reveals <strong>nothing</strong> about your secret.
            </p>
            <p className="text-slate-300 leading-relaxed">
                To restore the secret, you need a specific number of shares (the threshold). Any group of shares that meets this threshold can unlock the secret; anything less cannot.
            </p>
            <p className="text-slate-300 leading-relaxed">
                <strong>Handling large files & integrity:</strong><br />
                Pure Shamir&apos;s Secret Sharing has two limitations: it creates shares as large as the original data, and it cannot detect if a share has been tampered with. To solve both, this tool uses a hybrid approach:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Your data is encrypted with a unique, random 256-bit key (AES-GCM) generated locally in your browser. This adds <strong>data integrity</strong>, ensuring that if any share is modified, the restored secret will be invalid.</li>
                <li><em>Only that key</em> is then split into shares using Shamir&apos;s algorithm, which results in much smaller shares, also making it possible to encrypt larger files with this tool.</li>
            </ul>
            <p className="text-slate-300 leading-relaxed">
                <strong>Important disclaimer:</strong> This website was built by a hobbyist for personal use and is not a professional service created by cryptographic experts.
                It is provided "as is" without any warranties, express or implied.
                Use it at your own risk and ensure it meets your security requirements.
            </p>
            {onClose && (
                <div className="flex items-center gap-4 pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        className="text-slate-400 hover:text-slate-200 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
