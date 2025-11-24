interface Todo {
    id: string;
    text: string;
    done: boolean;
    progress: number;
}

interface MissingDataListProps {
    todos: Todo[];
}

export default function MissingDataList({ todos }: MissingDataListProps) {
    return (
        <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Missing Data</h4>
            <div className="space-y-3">
                {todos.map(todo => (
                    <div key={todo.id} className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-lg border ${todo.done ? 'bg-green-500/10 border-green-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                        {/* Progress bar overlay - hidden when complete */}
                        {!todo.done && (
                            <div
                                className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ease-out ${todo.id === 'data' ? 'bg-cyan-400' : 'bg-purple-500'
                                    }`}
                                style={{ width: `${todo.progress}%` }}
                            />
                        )}

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${todo.done ? 'bg-green-500 border-green-500 text-slate-900' : 'border-slate-500 text-slate-500'}`}>
                            {todo.done && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm ${todo.done ? 'text-green-400' : 'text-slate-300'}`}>{todo.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
