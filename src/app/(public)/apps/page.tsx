import { getAllPublishedApps } from '@/lib/data/apps'
import { AppCard } from '@/components/public/app-card'

export const metadata = { title: 'Semua Aplikasi' }

export default async function AllAppsPage() {
  const apps = await getAllPublishedApps()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="font-display text-xl font-semibold sm:text-2xl">Semua Aplikasi</h1>

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
    </main>
  )
}