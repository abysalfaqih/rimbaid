import { getAllPublishedApps } from '@/lib/data/apps'
import { AppTile } from '@/components/public/app-tile'

export const metadata = { title: 'Semua Aplikasi' }

export default async function AllAppsPage() {
  const apps = await getAllPublishedApps()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-xl font-semibold sm:text-2xl">Semua Aplikasi</h1>

      {apps.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Belum ada aplikasi di sini. Aplikasi pertama akan segera hadir.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {apps.map((app) => (
            <AppTile key={app.id} slug={app.slug} name={app.name} logoUrl={app.logo_url} />
          ))}
        </div>
      )}
    </main>
  )
}