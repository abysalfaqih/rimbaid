'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { appDetailsSchema, MAX_SCREENSHOTS } from '@/lib/validations/app'
import { slugify } from '@/lib/utils/slug'
import { uploadAppImage, deleteAppImage } from '@/lib/storage/app-images'
import type { Database } from '@/lib/types/database.types'

export type ActionState = { error?: string }

const screenshotMetaSchema = z
  .array(
    z.union([
      z.object({ kind: z.literal('existing'), id: z.string().uuid() }),
      z.object({ kind: z.literal('new'), tempKey: z.string() }),
    ])
  )
  .max(MAX_SCREENSHOTS, `Maksimal ${MAX_SCREENSHOTS} screenshot`)

function parseAppFormData(formData: FormData) {
  const raw = {
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    sizeLabel: String(formData.get('sizeLabel') ?? '') || undefined,
    version: String(formData.get('version') ?? '') || undefined,
    isPublished: formData.get('isPublished') === 'true',
    isNewUpdate: formData.get('isNewUpdate') === 'true',
    downloadButtons: JSON.parse(String(formData.get('downloadButtons') ?? '[]')),
    recommendedAppIds: JSON.parse(String(formData.get('recommendedAppIds') ?? '[]')),
  }
  return appDetailsSchema.parse(raw)
}

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

async function syncScreenshots(supabase: SupabaseClient<Database>, appId: string, formData: FormData) {
  const metaRaw = JSON.parse(String(formData.get('screenshotsMeta') ?? '[]'))
  const meta = screenshotMetaSchema.parse(metaRaw)

  const { data: existingRows } = await supabase
    .from('app_screenshots')
    .select('id, image_url')
    .eq('app_id', appId)

  const keptIds = new Set(meta.filter((m) => m.kind === 'existing').map((m) => m.id))
  const toDelete = (existingRows ?? []).filter((row) => !keptIds.has(row.id))

  for (const row of toDelete) {
    await deleteAppImage(supabase, 'app-screenshots', row.image_url)
  }
  if (toDelete.length > 0) {
    await supabase.from('app_screenshots').delete().in('id', toDelete.map((r) => r.id))
  }

  for (let index = 0; index < meta.length; index++) {
    const item = meta[index]
    if (item.kind === 'existing') {
      await supabase.from('app_screenshots').update({ sort_order: index }).eq('id', item.id)
    } else {
      const file = formData.get(`screenshotFile:${item.tempKey}`)
      if (!(file instanceof File)) continue
      const imageUrl = await uploadAppImage(supabase, 'app-screenshots', appId, file)
      const { error } = await supabase.from('app_screenshots').insert({ app_id: appId, image_url: imageUrl, sort_order: index })
      if (error) throw new Error(`Gagal menyimpan screenshot: ${error.message}`)
    }
  }
}

export async function createApp(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const supabase = await createClient()

  let values
  try {
    values = parseAppFormData(formData)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Data tidak valid' }
  }

  const slug = await generateUniqueSlug(supabase, values.name)

  const { data: newApp, error: insertError } = await supabase
    .from('apps')
    .insert({
      name: values.name,
      slug,
      description: values.description,
      size_label: values.sizeLabel || null,
      version: values.version || null,
      is_published: values.isPublished,
    })
    .select('id')
    .single()

  if (insertError || !newApp) {
    return { error: `Gagal membuat aplikasi: ${insertError?.message}` }
  }

  try {
    const logoFile = formData.get('logo')
    if (logoFile instanceof File && logoFile.size > 0) {
      const logoUrl = await uploadAppImage(supabase, 'app-logos', newApp.id, logoFile)
      await supabase.from('apps').update({ logo_url: logoUrl }).eq('id', newApp.id)
    }

    await syncDownloadButtons(supabase, newApp.id, values.downloadButtons)
    await syncRecommendations(supabase, newApp.id, values.recommendedAppIds)
    await syncScreenshots(supabase, newApp.id, formData)

    if (values.isNewUpdate) {
      await supabase.rpc('set_new_update_app', { target_app_id: newApp.id })
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan detail aplikasi' }
  }

  revalidatePath('/')
  revalidatePath('/apps')
  revalidatePath('/admin/apps')
  redirect('/admin/apps')
}

export async function updateApp(appId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()
  const supabase = await createClient()

  let values
  try {
    values = parseAppFormData(formData)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Data tidak valid' }
  }

  const { data: existingApp } = await supabase.from('apps').select('id, slug').eq('id', appId).maybeSingle()
  if (!existingApp) return { error: 'Aplikasi tidak ditemukan' }

  const { error: updateError } = await supabase
    .from('apps')
    .update({
      name: values.name,
      description: values.description,
      size_label: values.sizeLabel || null,
      version: values.version || null,
      is_published: values.isPublished,
    })
    .eq('id', appId)

  if (updateError) return { error: `Gagal memperbarui aplikasi: ${updateError.message}` }

  try {
    const logoFile = formData.get('logo')
    if (logoFile instanceof File && logoFile.size > 0) {
      const logoUrl = await uploadAppImage(supabase, 'app-logos', appId, logoFile)
      await supabase.from('apps').update({ logo_url: logoUrl }).eq('id', appId)
    }

    await syncDownloadButtons(supabase, appId, values.downloadButtons)
    await syncRecommendations(supabase, appId, values.recommendedAppIds)
    await syncScreenshots(supabase, appId, formData)

    if (values.isNewUpdate) {
      await supabase.rpc('set_new_update_app', { target_app_id: appId })
    } else {
      await supabase.rpc('clear_new_update_app', { target_app_id: appId })
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Gagal menyimpan detail aplikasi' }
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