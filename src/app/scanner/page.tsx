import GeocacheScanner from '@/features/geocache/GeocacheScanner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geocache Scanner - Secret Sharing',
  description: 'Specialized scanner for geocaching secrets with persistent storage',
};

export default function ScannerPage() {
  return <GeocacheScanner />;
}
