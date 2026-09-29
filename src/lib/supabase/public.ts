// src/lib/supabase/public.ts
//
// Client untuk QUERY PUBLIK MURNI -- tidak menyentuh cookies() sama sekali,
// supaya Next.js bisa meng-cache halaman yang memakainya (Home, Semua
// Aplikasi, detail aplikasi). Hanya untuk data yang sama bagi SEMUA
// pengunjung (aplikasi published) -- jangan pakai untuk apapun yang
// bergantung status login.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}