'use client'

import { createClient } from '@/lib/supabase/client'

type Bucket = 'app-logos' | 'app-screenshots'

const RULES: Record<Bucket, { types: Record<string, string>; maxBytes: number; label: string }> = {
  'app-logos': {
    types: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' },
    maxBytes: 2 * 1024 * 1024,
    label: '2 MB',
  },
  'app-screenshots': {
    types: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' },
    maxBytes: 5 * 1024 * 1024,
    label: '5 MB',
  },
}

export async function uploadImageFromBrowser(bucket: Bucket, appId: string, file: File) {
  const rule = RULES[bucket]
  const ext = rule.types[file.type]

  if (!ext) {
    throw new Error(`Format "${file.name}" tidak didukung. Gunakan: ${Object.values(rule.types).join(', ')}`)
  }
  if (file.size > rule.maxBytes) {
    throw new Error(`"${file.name}" melebihi batas ${rule.label}`)
  }

  const supabase = createClient()
  const path = `${appId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
  })
  if (error) throw new Error(`Gagal mengunggah "${file.name}": ${error.message}`)

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}