import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export async function checkRateLimit(key: string, maxHits: number, windowSeconds: number) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_max_hits: maxHits,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    // Fail-open yang disengaja: kalau pengecekan rate limit sendiri error,
    // lebih baik izinkan request daripada situs jadi tidak bisa dipakai.
    console.error('[checkRateLimit] gagal, izinkan request:', error)
    return true
  }

  return data === true
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? 'unknown'
}