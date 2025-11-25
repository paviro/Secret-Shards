import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Legal Disclosure',
  description: 'Legal disclosure and contact information for Secret Shards.',
  path: '/legal/',
});

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

