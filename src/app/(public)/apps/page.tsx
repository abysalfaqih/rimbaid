import { getAllPublishedApps } from '@/lib/data/apps'
import { AppCard } from '@/components/public/app-card'

export const metadata = {
  title: 'Semua Aplikasi',
}

export default async function AllAppsPage() {
  const apps = await getAllPublishedApps()

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <h1 className="mb-6 text-xl font-semibold sm:text-2xl">Semua Aplikasi</h1>

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
    </main>
  )
}