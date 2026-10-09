import { getDashboardSummary, getRecentEvents, getDailyTraffic } from '@/lib/data/stats'
import { RealtimeDashboard } from '@/components/admin/realtime-dashboard'

export default async function DashboardPage() {
  const [{ apps }, events, traffic] = await Promise.all([
    getDashboardSummary(),
    getRecentEvents(),
    getDailyTraffic(30),
  ])

  return <RealtimeDashboard initialApps={apps} initialEvents={events} initialTraffic={traffic} />
}