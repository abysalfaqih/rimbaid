import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { VERIFICATION_STEPS } from '@/lib/constants/verification'
import { createClient } from '@/lib/supabase/server'
import { recordAppDownload } from '@/lib/analytics/record-event'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session')
  const failUrl = new URL('/download-error', request.url)

  if (!sessionId) return NextResponse.redirect(failUrl)

  const supabase = createAdminClient()
  const { data: session } = await supabase
    .from('download_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) return NextResponse.redirect(failUrl)
  if (session.consumed_at) return NextResponse.redirect(failUrl)
  if (new Date(session.expires_at).getTime() < Date.now()) return NextResponse.redirect(failUrl)
  if (session.current_step !== 2 || !session.step3_started_at) return NextResponse.redirect(failUrl)

  const elapsedSeconds = (Date.now() - new Date(session.step3_started_at).getTime()) / 1000
  if (elapsedSeconds < VERIFICATION_STEPS[3].seconds) return NextResponse.redirect(failUrl)

  const { data: button } = await supabase
    .from('download_buttons')
    .select('url')
    .eq('id', session.button_id)
    .maybeSingle()

  if (!button) return NextResponse.redirect(failUrl)

  await supabase.from('download_sessions').update({ consumed_at: new Date().toISOString() }).eq('id', sessionId)

  const sessionClient = await createClient()
  const {
    data: { user: viewer },
  } = await sessionClient.auth.getUser()

  if (!viewer) {
    after(() =>
      recordAppDownload(session.app_id).catch((err) => console.error('[recordAppDownload] gagal:', err))
    )
  }

  return NextResponse.redirect(button.url)
}