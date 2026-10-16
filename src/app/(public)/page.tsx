import Link from 'next/link'
import { getNewUpdateApp, getHomeGridApps } from '@/lib/data/apps'
import { NewUpdateBanner } from '@/components/public/new-update-banner'
import { AppTile } from '@/components/public/app-tile'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const newUpdateApp = await getNewUpdateApp()
  const { apps, count } = await getHomeGridApps(newUpdateApp?.id)
  const hasMore = count > apps.length

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      {newUpdateApp && (
        <section className="mb-10 border-b border-border pb-10">
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
        <h2 className="font-display text-lg font-semibold sm:text-xl">Semua Aplikasi</h2>

        {apps.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Belum ada aplikasi di sini. Aplikasi pertama akan segera hadir.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {apps.map((app, index) => (
              <AppTile
                key={app.id}
                slug={app.slug}
                name={app.name}
                logoUrl={app.logo_url}
                eager={index < 6}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/apps">Lihat semua aplikasi</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}