'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { appPayloadSchema, type AppPayload } from '@/lib/validations/app'
import { slugify } from '@/lib/utils/slug'
import { deleteAppImage, isOwnStorageUrl } from '@/lib/storage/app-images'
import type { Database } from '@/lib/types/database.types'

export type ActionState = { error?: string }

async function generateUniqueSlug(supabase: SupabaseClient<Database>, name: string) {
  const base = slugify(name) || 'aplikasi'
  let candidate = base
  let suffix = 1
  for (let attempt = 0; attempt < 50; attempt++) {
    const { data } = await supabase.from('apps').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  throw new Error('Gagal membuat slug unik, coba nama lain')
}

// URL gambar hanya diterima kalau (a) sudah tersimpan di DB sebelumnya
// (mis. data lama) atau (b) berasal dari folder storage milik aplikasi ini.
function checkImageOwnership(
  values: AppPayload,
  existing: { logoUrl: string | null; screenshotUrls: string[] }
): string | null {
  if (
    values.logoUrl &&
    values.logoUrl !== existing.logoUrl &&
    !isOwnStorageUrl(values.logoUrl, 'app-logos', values.appId)
  ) {
    return 'URL logo tidak valid'
  }

  const known = new Set(existing.screenshotUrls)
  for (const url of values.screenshotUrls) {
    if (!known.has(url) && !isOwnStorageUrl(url, 'app-screenshots', values.appId)) {
      return 'URL screenshot tidak valid'
    }
  }
  return null
}

async function syncDownloadButtons(
  supabase: SupabaseClient<Database>,
  appId: string,
  buttons: { label: string; url: string }[]
) {
  await supabase.from('download_buttons').delete().eq('app_id', appId)
  if (buttons.length === 0) return
  const rows = buttons.map((b, index) => ({ app_id: appId, label: b.label, url: b.url, sort_order: index }))
  const { error } = await supabase.from('download_buttons').insert(rows)
  if (error) throw new Error(`Gagal menyimpan tombol download: ${error.message}`)
}

async function syncRecommendations(supabase: SupabaseClient<Database>, appId: string, recommendedAppIds: string[]) {
  await supabase.from('app_recommendations').delete().eq('app_id', appId)
  if (recommendedAppIds.length === 0) return
  const rows = recommendedAppIds.map((id, index) => ({ app_id: appId, recommended_app_id: id, sort_order: index }))
  const { error } = await supabase.from('app_recommendations').insert(rows)
  if (error) throw new Error(`Gagal menyimpan rekomendasi: ${error.message}`)
}

async function syncScreenshots(supabase: SupabaseClient<Database>, appId: string, urls: string[]) {
  const { data: existing } = await supabase.from('app_screenshots').select('id, image_url').eq('app_id', appId)
  const existingRows = existing ?? []

  const keep = new Set(urls)
  const toDelete = existingRows.filter((row) => !keep.has(row.image_url))

  if (toDelete.length > 0) {
    await supabase.from('app_screenshots').delete().in('id', toDelete.map((r) => r.id))
    for (const row of toDelete) {
      await deleteAppImage(supabase, 'app-screenshots', row.image_url)
    }
  }

  const idByUrl = new Map(existingRows.map((row) => [row.image_url, row.id]))

  for (let index = 0; index < urls.length; index++) {
    const url = urls[index]
    const existingId = idByUrl.get(url)

    if (existingId) {
      await supabase.from('app_screenshots').update({ sort_order: index }).eq('id', existingId)
    } else {
      const { error } = await supabase
        .from('app_screenshots')
        .insert({ app_id: appId, image_url: url, sort_order: index })
      if (error) throw new Error(`Gagal menyimpan screenshot: ${error.message}`)
    }
  }
}

async function applyNewUpdateFlag(supabase: SupabaseClient<Database>, appId: string, isNewUpdate: boolean) {
  const { error } = isNewUpdate
    ? await supabase.rpc('set_new_update_app', { target_app_id: appId })
    : await supabase.rpc('clear_new_update_app', { target_app_id: appId })
  if (error) throw new Error(`Gagal mengatur New Update: ${error.message}`)
}

export async function createApp(_prevState: ActionState, payload: AppPayload): Promise<ActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = appPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }
  const values = parsed.data

  const ownershipError = checkImageOwnership(values, { logoUrl: null, screenshotUrls: [] })
  if (ownershipError) return { error: ownershipError }

  const slug = await generateUniqueSlug(supabase, values.name)

  const { error: insertError } = await supabase.from('apps').insert({
    id: values.appId,
    name: values.name,
    slug,
    description: values.description,
    size_label: values.sizeLabel || null,
    version: values.version || null,
    logo_url: values.logoUrl,
    is_published: values.isPublished,
  })

  if (insertError) {
    return { error: `Gagal membuat aplikasi: ${insertError.message}` }
  }

  try {
    await syncDownloadButtons(supabase, values.appId, values.downloadButtons)
    await syncRecommendations(supabase, values.appId, values.recommendedAppIds)
    await syncScreenshots(supabase, values.appId, values.screenshotUrls)
    if (values.isNewUpdate) {
      await applyNewUpdateFlag(supabase, values.appId, true)
    }
  } catch (err) {
    // Batalkan aplikasi yang setengah jadi (tabel anak ikut terhapus lewat
    // on delete cascade). File gambar dibiarkan di Storage supaya percobaan
    // simpan berikutnya dari form yang sama bisa memakainya ulang.
    await supabase.from('apps').delete().eq('id', values.appId)
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan detail aplikasi' }
  }

  revalidatePath('/')
  revalidatePath('/apps')
  revalidatePath('/admin/apps')
  redirect('/admin/apps')
}

export async function updateApp(
  appId: string,
  _prevState: ActionState,
  payload: AppPayload
): Promise<ActionState> {
  await requireAdmin()
  const supabase = await createClient()

  const parsed = appPayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
  }
  const values = { ...parsed.data, appId }

  const { data: existingApp } = await supabase
    .from('apps')
    .select('id, slug, logo_url')
    .eq('id', appId)
    .maybeSingle()
  if (!existingApp) return { error: 'Aplikasi tidak ditemukan' }

  const { data: existingShots } = await supabase.from('app_screenshots').select('image_url').eq('app_id', appId)

  const ownershipError = checkImageOwnership(values, {
    logoUrl: existingApp.logo_url,
    screenshotUrls: (existingShots ?? []).map((s) => s.image_url),
  })
  if (ownershipError) return { error: ownershipError }

  const { error: updateError } = await supabase
    .from('apps')
    .update({
      name: values.name,
      description: values.description,
      size_label: values.sizeLabel || null,
      version: values.version || null,
      logo_url: values.logoUrl,
      is_published: values.isPublished,
    })
    .eq('id', appId)

  if (updateError) return { error: `Gagal memperbarui aplikasi: ${updateError.message}` }

  try {
    await syncDownloadButtons(supabase, appId, values.downloadButtons)
    await syncRecommendations(supabase, appId, values.recommendedAppIds)
    await syncScreenshots(supabase, appId, values.screenshotUrls)
    await applyNewUpdateFlag(supabase, appId, values.isNewUpdate)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan detail aplikasi' }
  }

  // Logo lama dibersihkan dari Storage hanya setelah semuanya berhasil tersimpan
  if (existingApp.logo_url && existingApp.logo_url !== values.logoUrl) {
    await deleteAppImage(supabase, 'app-logos', existingApp.logo_url)
  }

  revalidatePath('/')
  revalidatePath('/apps')
  revalidatePath(`/apps/${existingApp.slug}`)
  revalidatePath('/admin/apps')
  redirect('/admin/apps')
}

export async function deleteApp(appId: string) {
  await requireAdmin()
  const supabase = await createClient()

  const { data: app } = await supabase.from('apps').select('logo_url, slug').eq('id', appId).maybeSingle()
  const { data: screenshots } = await supabase.from('app_screenshots').select('image_url').eq('app_id', appId)

  await supabase.from('apps').delete().eq('id', appId)

  if (app?.logo_url) await deleteAppImage(supabase, 'app-logos', app.logo_url)
  for (const shot of screenshots ?? []) {
    await deleteAppImage(supabase, 'app-screenshots', shot.image_url)
  }

  revalidatePath('/')
  revalidatePath('/apps')
  revalidatePath('/admin/apps')
  if (app?.slug) revalidatePath(`/apps/${app.slug}`)
}