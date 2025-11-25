import { MetadataRoute } from 'next';
import { getBaseUrl, isLegalPagesEnabled } from '@/lib/config';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  // Core pages that are always available
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/scanner/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
  ];

  // Add legal pages if enabled
  if (isLegalPagesEnabled()) {
    routes.push(
      {
        url: `${baseUrl}/legal/`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.1,
      },
      {
        url: `${baseUrl}/privacy/`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.1,
      }
    );
  }

  return routes;
}

