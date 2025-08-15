// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://xn--299aa653fsxc.com'; // 메랜고고.com (Punycode)
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    // 필요하면 주요 고정 페이지들을 아래에 추가하세요.
    // { url: `${base}/items`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    // { url: `${base}/profile`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];
}
