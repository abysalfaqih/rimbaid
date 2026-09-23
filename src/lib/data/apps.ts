import { createClient } from '@/lib/supabase/server'

export const HOME_GRID_LIMIT = 6

export async function getNewUpdateApp() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version')
    .eq('is_published', true)
    .eq('is_new_update', true)
    .maybeSingle()

  return data
}

export async function getHomeGridApps(excludeId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version', { count: 'exact' })
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(HOME_GRID_LIMIT)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, count } = await query
  return { apps: data ?? [], count: count ?? 0 }
}

export async function getAllPublishedApps() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return data ?? []
}