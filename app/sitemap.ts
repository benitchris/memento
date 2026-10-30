import { MetadataRoute } from 'next';
import { DEMO_PROPERTIES, DEMO_DESTINATIONS } from '@/lib/data/mock-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://memento.rw';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/become-a-host`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const propertyPages: MetadataRoute.Sitemap = DEMO_PROPERTIES.filter(
    (p) => p.status === 'approved'
  ).map((p) => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  const destinationPages: MetadataRoute.Sitemap = DEMO_DESTINATIONS.map((d) => ({
    url: `${baseUrl}/search?destination=${encodeURIComponent(d.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticPages, ...propertyPages, ...destinationPages];
}

