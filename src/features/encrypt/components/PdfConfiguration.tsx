import { ChangeEvent } from 'react';

interface PdfConfigurationProps {
    title: string;
    onTitleChange: (title: string) => void;
}

export default function PdfConfiguration({ title, onTitleChange }: PdfConfigurationProps) {
    return (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-emerald-300">3. Configure PDF</h2>

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
        </div>
    );
}
