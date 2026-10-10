import { createClient } from '@/lib/supabase/server'

export async function getDashboardSummary() {
  const supabase = await createClient()
  const { data: apps } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, is_published, total_views, total_downloads')
    .order('total_views', { ascending: false })

  return { apps: apps ?? [] }
}

export async function getRecentEvents(limit = 20) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_events')
    .select('id, event_type, created_at, apps(name, slug)')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map((event) => ({
    id: event.id as string,
    event_type: event.event_type as 'view' | 'download',
    created_at: event.created_at as string,
    apps: Array.isArray(event.apps) ? (event.apps[0] ?? null) : (event.apps ?? null),
  }))
}

type DailyTrafficRow = {
  day: string
  views: number | string
  downloads: number | string
}

export async function getDailyTraffic(days = 30) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_daily_traffic', { p_days: days })

  if (error) {
    console.error('[getDailyTraffic] gagal:', error)
  }

  const rows = (data ?? []) as DailyTrafficRow[]

  return rows.map((row) => ({
    day: String(row.day),
    views: Number(row.views),
    downloads: Number(row.downloads),
  }))
}