import GeocacheScanner from '@/features/geocache/GeocacheScanner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geocache Scanner - Secret Sharing',
  description: 'Specialized scanner for geocaching secrets with persistent storage',
};

export default function ScannerPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <GeocacheScanner />
    </main>
  );
}
