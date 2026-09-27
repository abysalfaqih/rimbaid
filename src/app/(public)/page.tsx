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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
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
          <div className="mt-2 divide-y divide-border">
            {apps.map((app) => (
              <AppCard key={app.id} {...app} logoUrl={app.logo_url} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/apps">Lihat semua aplikasi</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  )
}