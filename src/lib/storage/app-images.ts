import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

type Bucket = 'app-logos' | 'app-screenshots'

// Memastikan URL gambar benar-benar berasal dari bucket kita, di folder
// milik aplikasi ini -- bukan URL sembarang yang dikirim lewat payload.
export function isOwnStorageUrl(url: string, bucket: Bucket, appId: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base || url.includes('..')) return false
  return url.startsWith(`${base}/storage/v1/object/public/${bucket}/${appId}/`)
}

export async function deleteAppImage(
  supabase: SupabaseClient<Database>,
  bucket: Bucket,
  publicUrl: string
) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from(bucket).remove([path])
}