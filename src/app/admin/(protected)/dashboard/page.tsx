import { getDashboardSummary, getRecentEvents } from '@/lib/data/stats'
import { RealtimeDashboard } from '@/components/admin/realtime-dashboard'

export default async function DashboardPage() {
  const { apps } = await getDashboardSummary()
  const events = await getRecentEvents()

  return <RealtimeDashboard initialApps={apps} initialEvents={events} />
}