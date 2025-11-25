import GeocacheScanner from '@/features/geocache/GeocacheScanner';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geocache Scanner - Secret Shards',
  description: 'Specialized scanner for geocaching secrets',
};

export default function ScannerPage() {
  return <GeocacheScanner />;
}
