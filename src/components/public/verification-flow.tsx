'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Phase = 'starting' | 'counting' | 'ready' | 'advancing' | 'error'
type StepState = { step: 1 | 2 | 3; requiredSeconds: number }

export function VerificationFlow({
  appName,
  buttonId,
  buttonLabel,
}: {
  appName: string
  buttonId: string
  buttonLabel: string
}) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [current, setCurrent] = useState<StepState>({ step: 1, requiredSeconds: 10 })
  const [remaining, setRemaining] = useState(10)
  const [phase, setPhase] = useState<Phase>('starting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function start() {
      try {
        const res = await fetch('/api/verify/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buttonId }),
        })
        const json = await res.json()
        if (!res.ok) {
          setErrorMessage(json.error ?? 'Gagal memulai verifikasi')
          setPhase('error')
          return
        }
        setSessionId(json.sessionId)
        setCurrent({ step: 1, requiredSeconds: json.requiredSeconds })
        setRemaining(json.requiredSeconds)
        setPhase('counting')
      } catch {
        setErrorMessage('Koneksi bermasalah, silakan muat ulang halaman')
        setPhase('error')
      }
    }
    start()
  }, [buttonId])

  useEffect(() => {
    if (phase !== 'counting') return
    if (remaining <= 0) {
      setPhase('ready')
      return
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, remaining])

  const handleNext = useCallback(async () => {
    if (!sessionId) return
    setPhase('advancing')
    setErrorMessage(null)

    if (current.step === 3) {
      window.location.href = `/api/verify/download?session=${sessionId}`
      return
    }

    try {
      const res = await fetch('/api/verify/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, step: current.step }),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrorMessage(json.error ?? 'Verifikasi gagal, silakan coba lagi')
        setPhase('ready')
        return
      }

      setCurrent({ step: json.nextStep, requiredSeconds: json.requiredSeconds })
      setRemaining(json.requiredSeconds)
      setPhase('counting')
    } catch {
      setErrorMessage('Koneksi bermasalah, silakan coba lagi')
      setPhase('ready')
    }
  }, [sessionId, current.step])

  if (phase === 'error') {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <ShieldCheck className="mx-auto mb-4 size-10 text-primary" />
      <h1 className="text-lg font-semibold">Verifikasi Download</h1>
      <p className="mt-1 text-sm text-muted-foreground">{appName} — {buttonLabel}</p>

      <div className="my-8">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Langkah {current.step} dari 3
        </span>
        <div className="mt-3 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <span key={s} className={`h-1.5 w-10 rounded-full ${s <= current.step && phase !== 'starting' ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {(phase === 'starting' || phase === 'counting') && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-3xl font-bold tabular-nums">{phase === 'starting' ? '' : remaining}</p>
          <p className="text-xs text-muted-foreground">Mohon tunggu sebentar...</p>
        </div>
      )}

      {phase === 'ready' && (
        <Button size="lg" onClick={handleNext}>
          {current.step === 3 ? 'Download' : 'Lanjut'}
        </Button>
      )}

      {phase === 'advancing' && (
        <Button size="lg" disabled>
          <Loader2 className="mr-2 size-4 animate-spin" />
          Memproses...
        </Button>
      )}

      {errorMessage && phase === 'ready' && <p className="mt-3 text-sm text-destructive">{errorMessage}</p>}
    </div>
  )
}