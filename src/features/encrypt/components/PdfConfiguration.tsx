import { ChangeEvent } from 'react';
interface PdfConfigurationProps {
    title: string;
    onTitleChange: (title: string) => void;
    maxPages: number;
    onMaxPagesChange: (maxPages: number) => void;
}

export default function PdfConfiguration({ title, onTitleChange, maxPages, onMaxPagesChange }: PdfConfigurationProps) {
    const handleMaxPagesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Allow empty string (user is deleting to retype)
        if (value === '') {
            onMaxPagesChange(NaN);
            return;
        }

        const num = parseInt(value, 10);
        // Allow the user to type any number, we'll validate it
        onMaxPagesChange(num);
    };

    const maxPagesValid = !isNaN(maxPages) && maxPages >= 1 && maxPages <= 30;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-emerald-300">3. Configure PDF</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="pdf-title" className="block text-sm font-medium text-slate-400 mb-2">
                        Title (Optional)
                        <span className="ml-2 text-xs text-slate-500">Displayed as document header</span>
                    </label>
                    <input
                        id="pdf-title"
                        name="pdfTitle"
                        type="text"
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => onTitleChange(e.target.value)}
                        maxLength={50}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g. Main Wallet Backup"
                    />
                </div>

                <div>
                    <label htmlFor="max-pages" className="block text-sm font-medium text-slate-400 mb-2">
                        Max Pages Per Share PDF
                        <span className="ml-2 text-xs text-slate-500">Controls embedded data (1-30)</span>
                    </label>
                    <input
                        id="max-pages"
                        name="maxPages"
                        type="number"
                        min={1}
                        max={30}
                        value={isNaN(maxPages) ? '' : maxPages}
                        onChange={handleMaxPagesChange}
                        className={`w-full bg-slate-950 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all ${!isNaN(maxPages) && !maxPagesValid ? 'border-red-500' : 'border-slate-800'
                            }`}
                    />
                    {!isNaN(maxPages) && !maxPagesValid ? (
                        <p className="mt-1 text-xs text-red-400">
                            {maxPages < 1 ? 'Must be at least 1' : 'Must be at most 30'}
                        </p>
                    ) : (
                        <p className="mt-1 text-xs text-slate-500">
                            {(() => {
                                const effectiveMaxPages = isNaN(maxPages) ? 1 : maxPages;
                                const dataPages = Math.max(0, effectiveMaxPages - 1);

                                const pageDescription = dataPages > 0
                                    ? `${dataPages} data page${dataPages === 1 ? '' : 's'}`
                                    : 'no data pages';

                                return `Up to 1 key share + ${pageDescription}.`;
                            })()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
