import Link from 'next/link'
import Image from 'next/image'
import { getAdminAppsList } from '@/lib/data/apps'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteAppButton } from '@/components/admin/delete-app-button'

export default async function AdminAppsPage() {
  const apps = await getAdminAppsList()

  return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kelola Aplikasi</h1>
        <Button asChild><Link href="/admin/apps/new">Tambah Aplikasi</Link></Button>
      </div>

      {apps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Belum ada aplikasi. Klik "Tambah Aplikasi" untuk membuat yang pertama.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr><th className="p-3">Aplikasi</th><th className="p-3">Status</th><th className="p-3 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="border-t border-border">
                  <td className="flex items-center gap-3 p-3">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {app.logo_url && <Image src={app.logo_url} alt={app.name} fill className="object-cover" sizes="40px" />}
                    </div>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">/{app.slug}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      <Badge variant={app.is_published ? 'default' : 'secondary'}>
                        {app.is_published ? 'Published' : 'Draft'}
                      </Badge>
                      {app.is_new_update && <Badge className="bg-accent text-accent-foreground">New Update</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm"><Link href={`/admin/apps/${app.id}/edit`}>Edit</Link></Button>
                      <DeleteAppButton appId={app.id} appName={app.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}