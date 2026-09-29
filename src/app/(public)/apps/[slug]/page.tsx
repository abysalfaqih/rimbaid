import { notFound } from 'next/navigation'
import Image from 'next/image'
import { headers } from 'next/headers'
import { after } from 'next/server'
import type { Metadata } from 'next'
import {
  getAppBySlug,
  getDownloadButtonLabels,
  getAppScreenshots,
  getAppRecommendations,
} from '@/lib/data/apps'
import { createClient } from '@/lib/supabase/server'
import { recordAppView } from '@/lib/analytics/record-event'
import { AppCard } from '@/components/public/app-card'
import { DownloadButtonList } from '@/components/public/download-button-list'
import { ScreenshotGallery } from '@/components/public/screenshot-gallery'

type Props = { params: Promise<{ slug: string }> }

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const app = await getAppBySlug(slug)
  if (!app) return {}

  const url = `${siteUrl}/apps/${app.slug}`

  return {
    title: app.name,
    description: app.description,
    alternates: { canonical: url },
    openGraph: {
      title: app.name,
      description: app.description,
      url,
      siteName: 'Rimba ID',
      images: app.logo_url ? [{ url: app.logo_url }] : [],
      locale: 'id_ID',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: app.name,
      description: app.description,
      images: app.logo_url ? [app.logo_url] : [],
    },
  }
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params
  const app = await getAppBySlug(slug)

  if (!app) {
    notFound()
  }

  // Cek admin dilakukan DI SINI (bukan di dalam after()) karena cookies()
  // tidak boleh dipanggil di dalam after() -- ini juga sebabnya halaman
  // ini tetap dynamic (lihat 11.1).
  const supabase = await createClient()
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  if (!viewer) {
    after(() =>
      recordAppView(app.id).catch((err) => console.error('[recordAppView] gagal:', err))
    )
  }

  const [buttons, screenshots, recommendations] = await Promise.all([
    getDownloadButtonLabels(app.id),
    getAppScreenshots(app.id),
    getAppRecommendations(app.id),
  ])

  const nonce = (await headers()).get('x-nonce') ?? undefined
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    ...(app.version ? { softwareVersion: app.version } : {}),
    ...(app.logo_url ? { image: app.logo_url } : {}),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:mx-0">
          {app.logo_url ? (
            <Image
              src={app.logo_url}
              alt={`Logo ${app.name}`}
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
              {app.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{app.name}</h1>
          <dl className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            {app.version && (
              <div className="flex gap-1">
                <dt className="font-medium text-foreground/70">Versi</dt>
                <dd>{app.version}</dd>
              </div>
            )}
            {app.size_label && (
              <div className="flex gap-1">
                <dt className="font-medium text-foreground/70">Ukuran</dt>
                <dd>{app.size_label}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5">
            <DownloadButtonList slug={app.slug} buttons={buttons} />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold">Deskripsi</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {app.description}
        </p>
      </section>

      {screenshots.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold">Screenshot</h2>
          <ScreenshotGallery screenshots={screenshots} appName={app.name} />
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="mt-14 border-t border-border pt-8">
          <h2 className="mb-2 font-display text-lg font-semibold">Mungkin Anda suka</h2>
          <div className="divide-y divide-border">
            {recommendations.map((rec) => (
              <AppCard
                key={rec.id}
                slug={rec.slug}
                name={rec.name}
                logoUrl={rec.logo_url}
                description={rec.description}
                version={rec.version}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}