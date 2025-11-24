export default function Header() {
    return (
        <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                Secret Shards
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Securely split your secrets using Shamir's Secret Sharing.
                Encrypt files or text, distribute the keys, and recover them only when enough shares are combined.
            </p>
        </header>
    );
}
