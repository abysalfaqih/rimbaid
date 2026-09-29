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