import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from './actions'
import { Button } from '@/components/ui/button'

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin/dashboard" className="hover:text-primary">Dashboard</Link>
          <Link href="/admin/apps" className="hover:text-primary">Kelola Aplikasi</Link>
        </nav>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">Keluar</Button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}