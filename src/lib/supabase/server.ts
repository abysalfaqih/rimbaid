// src/lib/supabase/server.ts
// Dipakai di Server Component, Server Action, dan Route Handler
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Aman diabaikan jika dipanggil dari Server Component murni
            // (bukan Server Action) — sesi akan tetap di-refresh oleh middleware.
          }
        },
      },
    }
  )
}