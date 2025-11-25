import GeocacheScanner from '@/features/geocache/GeocacheScanner';
import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Geocache Scanner',
  description: 'Specialized scanner for collecting multi-part secrets in physical locations. Perfect for treasure hunts, scavenger games, and geocaching adventures. Scan QR codes from different locations to collect secret shares.',
  path: '/scanner/',
});

export default function ScannerPage() {
  return <GeocacheScanner />;
}
