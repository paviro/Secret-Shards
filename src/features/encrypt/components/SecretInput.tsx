import { ChangeEvent } from 'react';

interface SecretInputProps {
    text: string;
    onTextChange: (text: string) => void;
    disabled?: boolean;
}

export default function SecretInput({ text, onTextChange, disabled = false }: SecretInputProps) {
    return (
        <div>
            <label htmlFor="secret-text" className="block text-sm font-medium text-slate-400 mb-2">Secret Text</label>
            <textarea
                id="secret-text"
                name="secretText"
                value={text}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onTextChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your secret message here (e.g., a password, recovery seed, or personal note)..."
            />
        </div>
    );
}
