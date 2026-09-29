// src/lib/data/apps.ts
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'

export const HOME_GRID_LIMIT = 6

// --- Query publik (tanpa cookies -- halaman yang memakainya bisa di-cache) ---

export async function getNewUpdateApp() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version')
    .eq('is_published', true)
    .eq('is_new_update', true)
    .maybeSingle()

  return data
}

export async function getHomeGridApps(excludeId?: string) {
  const supabase = createPublicClient()
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
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getAppBySlug(slug: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, description, version, size_label')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  return data
}

export async function getAppScreenshots(appId: string) {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('app_screenshots')
    .select('id, image_url')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

export async function getAppRecommendations(appId: string) {
  const supabase = createPublicClient()

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

  const appsById = new Map(apps.map((app) => [app.id, app]))
  return ids
    .map((id) => appsById.get(id))
    .filter((app): app is NonNullable<typeof app> => app !== undefined)
}

export async function getDownloadButtonLabels(appId: string) {
  // PENTING: pakai admin client karena RLS Fase 2 sengaja memblokir anon
  // membaca tabel download_buttons sama sekali. Kita HANYA select kolom
  // aman (id, label) -- TIDAK PERNAH menyertakan kolom `url` di sini.
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('download_buttons')
    .select('id, label')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  return data ?? []
}

// --- Query admin (butuh sesi login, memakai cookie-aware client) ---

export async function getAdminAppsList() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('apps')
    .select('id, name, slug, logo_url, is_published, is_new_update, created_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAppForEdit(appId: string) {
  const supabase = await createClient()
  const { data: app } = await supabase.from('apps').select('*').eq('id', appId).maybeSingle()
  if (!app) return null

  const { data: buttons } = await supabase
    .from('download_buttons')
    .select('id, label, url, sort_order')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  const { data: screenshots } = await supabase
    .from('app_screenshots')
    .select('id, image_url, sort_order')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  const { data: recommendations } = await supabase
    .from('app_recommendations')
    .select('recommended_app_id, sort_order')
    .eq('app_id', appId)
    .order('sort_order', { ascending: true })

  return {
    app,
    buttons: buttons ?? [],
    screenshots: screenshots ?? [],
    recommendedAppIds: (recommendations ?? []).map((r) => r.recommended_app_id),
  }
}

export async function getRecommendationOptions(excludeId?: string) {
  const supabase = await createClient()
  let query = supabase.from('apps').select('id, name').order('name', { ascending: true })
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return data ?? []
}