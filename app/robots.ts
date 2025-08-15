// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://xn--299aa653fsxc.com/sitemap.xml',
    host: 'https://xn--299aa653fsxc.com',
  };
}
