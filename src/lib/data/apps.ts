import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function getAppBySlug(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version, size_label')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  return data
}

export async function getDownloadButtonLabels(appId: string) {
  // PENTING: pakai admin client karena RLS Fase 2 sengaja memblokir anon
  // membaca tabel download_buttons sama sekali. Kita HANYA select kolom
  // aman (id, label) — TIDAK PERNAH menyertakan kolom `url` di sini.
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('download_buttons')
    .select('id, label')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export async function getAppScreenshots(appId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_screenshots')
    .select('id, image_url')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export async function getAppRecommendations(appId: string) {
  const supabase = await createClient()

  const { data: links } = await supabase
    .from('app_recommendations')
    .select('recommended_app_id, sort_order')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  if (!links || links.length === 0) return []

  const ids = links.map((link) => link.recommended_app_id)

  const { data: apps } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version')
    .in('id', ids)
    .eq('is_published', true)

  if (!apps) return []

  // Urutkan kembali sesuai sort_order yang diatur admin, bukan urutan hasil query
  const appsById = new Map(apps.map((app) => [app.id, app]))
  return ids
    .map((id) => appsById.get(id))
    .filter((app): app is NonNullable<typeof app> => app !== undefined)
}