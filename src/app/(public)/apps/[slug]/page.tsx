import { notFound } from 'next/navigation'
import Image from 'next/image'
import { after } from 'next/server'
import {
  getAppBySlug,
  getDownloadButtonLabels,
  getAppScreenshots,
  getAppRecommendations,
} from '@/lib/data/apps'
import { AppCard } from '@/components/public/app-card'
import { DownloadButtonList } from '@/components/public/download-button-list'
import { ScreenshotGallery } from '@/components/public/screenshot-gallery'
import { createClient } from '@/lib/supabase/server'
import { recordAppView } from '@/lib/analytics/record-event'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const app = await getAppBySlug(slug)
  if (!app) return {}
  return { title: app.name, description: app.description }
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params
  const app = await getAppBySlug(slug)

  if (!app) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()

  // Jangan hitung kunjungan admin sendiri sebagai "view" publik.
  // after() menjalankan ini SETELAH respons dikirim ke browser,
  // jadi tidak menambah waktu tunggu halaman sama sekali.
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:mx-0">
          {app.logo_url ? (
            <Image src={app.logo_url} alt={`Logo ${app.name}`} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
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
        <h2 className="mb-3 text-lg font-semibold">Deskripsi</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {app.description}
        </p>
      </section>

      {screenshots.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Screenshot</h2>
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