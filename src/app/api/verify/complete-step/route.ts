import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { VERIFICATION_STEPS } from '@/lib/constants/verification'

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  step: z.union([z.literal(1), z.literal(2)]),
})

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })
  }

  const { sessionId, step } = parsed.data
  const supabase = createAdminClient()

  const { data: session } = await supabase
    .from('download_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ error: 'Sesi tidak ditemukan' }, { status: 404 })
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Sesi sudah kedaluwarsa, silakan mulai ulang' }, { status: 410 })
  }
  if (session.consumed_at) {
    return NextResponse.json({ error: 'Sesi sudah digunakan' }, { status: 410 })
  }
  if (session.current_step !== step - 1) {
    return NextResponse.json({ error: 'Urutan langkah tidak valid' }, { status: 409 })
  }

  const requiredSeconds = VERIFICATION_STEPS[step].seconds
  const startedAt = step === 1 ? session.step1_started_at : session.step2_started_at
  const elapsedSeconds = (Date.now() - new Date(startedAt!).getTime()) / 1000

  if (elapsedSeconds < requiredSeconds) {
    return NextResponse.json(
      { error: 'Waktu tunggu belum selesai', remainingSeconds: Math.ceil(requiredSeconds - elapsedSeconds) },
      { status: 425 }
    )
  }

  const nextStep = (step + 1) as 2 | 3
  const now = new Date().toISOString()
  const updatePayload =
    step === 1
      ? { current_step: 1, step1_completed_at: now, step2_started_at: now }
      : { current_step: 2, step2_completed_at: now, step3_started_at: now }

  await supabase.from('download_sessions').update(updatePayload).eq('id', sessionId)

  return NextResponse.json({ nextStep, requiredSeconds: VERIFICATION_STEPS[nextStep].seconds })
}