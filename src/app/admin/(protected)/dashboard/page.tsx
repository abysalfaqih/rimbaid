import { logout } from '../actions'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={logout}>
          <Button type="submit" variant="outline">Keluar</Button>
        </form>
      </div>
      <p className="text-muted-foreground">
        Statistik realtime akan dibangun di Fase 8. Halaman ini sementara
        hanya untuk memastikan alur login/logout berjalan benar.
      </p>
    </div>
  )
}