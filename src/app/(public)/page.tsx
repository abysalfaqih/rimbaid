import Link from 'next/link'
import { getNewUpdateApp, getHomeGridApps } from '@/lib/data/apps'
import { NewUpdateBanner } from '@/components/public/new-update-banner'
import { AppCard } from '@/components/public/app-card'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const newUpdateApp = await getNewUpdateApp()
  const { apps, count } = await getHomeGridApps(newUpdateApp?.id)
  const hasMore = count > apps.length

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {newUpdateApp && (
        <section className="mb-12">
          <NewUpdateBanner
            slug={newUpdateApp.slug}
            name={newUpdateApp.name}
            logoUrl={newUpdateApp.logo_url}
            description={newUpdateApp.description}
            version={newUpdateApp.version}
          />
        </section>
      )}

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">Semua Aplikasi</h2>
        </div>

        {apps.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            Belum ada aplikasi yang dipublikasikan.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppCard key={app.id} {...app} logoUrl={app.logo_url} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/apps">Lihat semua aplikasi</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}