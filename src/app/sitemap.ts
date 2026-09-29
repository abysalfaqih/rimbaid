import type { MetadataRoute } from 'next'
import { getAllPublishedApps } from '@/lib/data/apps'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const apps = await getAllPublishedApps()

  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/apps`, changeFrequency: 'daily', priority: 0.8 },
    ...apps.map((app) => ({
      url: `${siteUrl}/apps/${app.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}