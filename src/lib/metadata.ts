import { Metadata } from 'next';
import { getBaseUrl } from './config';

export interface MetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

/**
 * Generate comprehensive metadata for SEO, Open Graph, and Twitter Cards
 */
export function generateMetadata(options: MetadataOptions = {}): Metadata {
  const baseUrl = getBaseUrl();
  const {
    title = 'Secret Shards',
    description = "Securely split your secrets using Shamir's Secret Sharing. Encrypt files or text, distribute the shares, and recover them only when enough shares are combined.",
    path = '',
    type = 'website',
    noindex = false,
  } = options;

  const url = `${baseUrl}${path}`;
  const fullTitle = path ? `${title} - Secret Shards` : title;

  // Build Open Graph metadata
  const openGraph: NonNullable<Metadata['openGraph']> = {
    type,
    url,
    title: fullTitle,
    description,
    siteName: 'Secret Shards',
    locale: 'en_US',
  };

  // Build Twitter metadata
  const twitter: NonNullable<Metadata['twitter']> = {
    card: 'summary',
    title: fullTitle,
    description,
  };

  return {
    title: fullTitle,
    description,
    keywords: [
      'secret sharing',
      'Shamir secret sharing',
      'encryption',
      'secure file sharing',
      'cryptography',
      'client-side encryption',
      'privacy',
      'zero trust',
      'geocaching',
      'QR code',
      'PDF encryption',
    ],
    creator: 'Paul-Vincent Roll',
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph,
    twitter,
    alternates: {
      canonical: url,
    },
    metadataBase: new URL(baseUrl),
    verification: {
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // yahoo: 'your-yahoo-verification-code',
    },
  };
}

