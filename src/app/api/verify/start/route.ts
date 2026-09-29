import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { VERIFICATION_STEPS } from '@/lib/constants/verification'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isTrustedOrigin } from '@/lib/security/origin'

const bodySchema = z.object({ buttonId: z.string().uuid() })

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Origin tidak diizinkan' }, { status: 403 })
  }

  const ip = getClientIp(request)
  const allowed = await checkRateLimit(`verify-start:${ip}`, 20, 600) // 20x / 10 menit
  if (!allowed) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan, coba lagi nanti' }, { status: 429 })
  }
  
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: button } = await supabase
    .from('download_buttons')
    .select('id, app_id')
    .eq('id', parsed.data.buttonId)
    .maybeSingle()

  if (!button) {
    return NextResponse.json({ error: 'Tombol download tidak ditemukan' }, { status: 404 })
  }

  const { data: app } = await supabase
    .from('apps')
    .select('id, is_published')
    .eq('id', button.app_id)
    .maybeSingle()

  if (!app || !app.is_published) {
    return NextResponse.json({ error: 'Aplikasi tidak ditemukan' }, { status: 404 })
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = request.headers.get('user-agent')

  const { data: session, error } = await supabase
    .from('download_sessions')
    .insert({ app_id: button.app_id, button_id: button.id, ip_address: ipAddress, user_agent: userAgent })
    .select('id')
    .single()

  if (error || !session) {
    return NextResponse.json({ error: 'Gagal memulai sesi verifikasi' }, { status: 500 })
  }

  return NextResponse.json({ sessionId: session.id, step: 1, requiredSeconds: VERIFICATION_STEPS[1].seconds })
}