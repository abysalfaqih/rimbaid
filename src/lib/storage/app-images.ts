import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type Bucket = 'app-logos' | 'app-screenshots'

export async function uploadAppImage(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  appId: string,
  file: File
) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${appId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
  })
  if (error) throw new Error(`Gagal upload gambar (${bucket}): ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteAppImage(supabase: SupabaseClient<Database>, bucket: Bucket, publicUrl: string) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from(bucket).remove([path])
}