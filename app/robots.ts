import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://memento.rw';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/host/bookings', '/dashboard/bookings'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

