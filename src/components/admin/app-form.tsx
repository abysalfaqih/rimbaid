'use client'

import { startTransition, useActionState, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { LogoUploader } from './logo-uploader'
import { DownloadButtonsField, type DownloadButtonItem } from './download-buttons-field'
import { ScreenshotsField, type ScreenshotItem } from './screenshots-field'
import { RecommendationsField } from './recommendations-field'
import { appDetailsSchema, type AppPayload } from '@/lib/validations/app'
import { uploadImageFromBrowser } from '@/lib/storage/upload-client'
import type { ActionState } from '@/app/admin/(protected)/apps/actions'

type AppFormInitialData = {
  id: string
  name: string
  slug: string
  description: string
  sizeLabel: string
  version: string
  isPublished: boolean
  isNewUpdate: boolean
  logoUrl: string | null
  downloadButtons: DownloadButtonItem[]
  screenshots: { id: string; url: string }[]
  recommendedAppIds: string[]
}

export function AppForm({
  action,
  initialData,
  recommendationOptions,
}: {
  action: (prevState: ActionState, payload: AppPayload) => Promise<ActionState>
  initialData?: AppFormInitialData
  recommendationOptions: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, {})

  // Aplikasi baru: ID dibuat di browser supaya gambar bisa langsung diunggah
  // ke folder <appId>/ sebelum barisnya ada di database.
  const [appId] = useState(() => initialData?.id ?? crypto.randomUUID())

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [sizeLabel, setSizeLabel] = useState(initialData?.sizeLabel ?? '')
  const [version, setVersion] = useState(initialData?.version ?? '')
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false)
  const [isNewUpdate, setIsNewUpdate] = useState(initialData?.isNewUpdate ?? false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [downloadButtons, setDownloadButtons] = useState<DownloadButtonItem[]>(
    initialData?.downloadButtons?.length ? initialData.downloadButtons : [{ label: '', url: '' }]
  )
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>(
    (initialData?.screenshots ?? []).map((s) => ({
      tempKey: s.id,
      kind: 'existing' as const,
      id: s.id,
      previewUrl: s.url,
    }))
  )
  const [recommendedAppIds, setRecommendedAppIds] = useState<string[]>(initialData?.recommendedAppIds ?? [])

  const [isUploading, setIsUploading] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)

  // Mengingat file yang sudah terunggah, supaya menekan Simpan ulang setelah
  // error tidak mengunggah file yang sama dua kali.
  const uploadedRef = useRef(new Map<File, string>())

  async function uploadOnce(bucket: 'app-logos' | 'app-screenshots', file: File) {
    const cached = uploadedRef.current.get(file)
    if (cached) return cached
    const url = await uploadImageFromBrowser(bucket, appId, file)
    uploadedRef.current.set(file, url)
    return url
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (isUploading || isPending) return
    setClientError(null)

    // Validasi detail dulu SEBELUM mengunggah apapun
    const details = appDetailsSchema.safeParse({
      name,
      description,
      sizeLabel: sizeLabel || undefined,
      version: version || undefined,
      isPublished,
      isNewUpdate,
      downloadButtons,
      recommendedAppIds,
    })
    if (!details.success) {
      setClientError(details.error.issues[0]?.message ?? 'Data tidak valid')
      return
    }

    setIsUploading(true)
    try {
      const logoUrl = logoFile ? await uploadOnce('app-logos', logoFile) : (initialData?.logoUrl ?? null)

      const screenshotUrls = await Promise.all(
        screenshots.map((s) => (s.kind === 'existing' ? s.previewUrl : uploadOnce('app-screenshots', s.file)))
      )

      const payload: AppPayload = { ...details.data, appId, logoUrl, screenshotUrls }

      startTransition(() => {
        formAction(payload)
      })
    } catch (err) {
      setClientError(err instanceof Error ? err.message : 'Gagal mengunggah gambar')
    } finally {
      setIsUploading(false)
    }
  }

  const errorMessage = clientError ?? state.error
  const isBusy = isUploading || isPending

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Aplikasi</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={initialData?.slug ?? '(dibuat otomatis setelah disimpan)'} disabled />
        <p className="text-xs text-muted-foreground">Slug dibuat otomatis dari nama dan tidak bisa diubah.</p>
      </div>

      <LogoUploader initialUrl={initialData?.logoUrl} onChange={setLogoFile} />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input id="size" placeholder="mis. 45 MB" value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input id="version" placeholder="mis. 1.0.0" value={version} onChange={(e) => setVersion(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <DownloadButtonsField value={downloadButtons} onChange={setDownloadButtons} />
      <ScreenshotsField value={screenshots} onChange={setScreenshots} />
      <RecommendationsField options={recommendationOptions} value={recommendedAppIds} onChange={setRecommendedAppIds} />

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">Tandai sebagai New Update</p>
          <p className="text-xs text-muted-foreground">Akan menggantikan aplikasi New Update sebelumnya di Home.</p>
        </div>
        <Switch checked={isNewUpdate} onCheckedChange={setIsNewUpdate} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">Publikasikan</p>
          <p className="text-xs text-muted-foreground">Draft tidak akan tampil di halaman publik.</p>
        </div>
        <Switch checked={isPublished} onCheckedChange={setIsPublished} />
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isBusy}>
          {isUploading ? 'Mengunggah gambar...' : isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" disabled={isBusy} onClick={() => router.push('/admin/apps')}>
          Batal
        </Button>
      </div>
    </form>
  )
}