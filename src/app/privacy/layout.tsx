import { Metadata } from 'next';
import { generateMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for Secret Shards. Learn how we protect your data with 100% local processing, no data collection, and client-side encryption.',
  path: '/privacy/',
});

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

