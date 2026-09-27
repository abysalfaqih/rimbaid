'use client'

import { useActionState, useState } from 'react'
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
import type { ActionState } from '@/app/admin/(protected)/apps/actions'

type AppFormInitialData = {
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
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
  initialData?: AppFormInitialData
  recommendationOptions: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(action, {})

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
    (initialData?.screenshots ?? []).map((s) => ({ tempKey: s.id, kind: 'existing' as const, id: s.id, previewUrl: s.url }))
  )
  const [recommendedAppIds, setRecommendedAppIds] = useState<string[]>(initialData?.recommendedAppIds ?? [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('name', name)
    formData.set('description', description)
    formData.set('sizeLabel', sizeLabel)
    formData.set('version', version)
    formData.set('isPublished', String(isPublished))
    formData.set('isNewUpdate', String(isNewUpdate))
    formData.set('downloadButtons', JSON.stringify(downloadButtons))
    formData.set('recommendedAppIds', JSON.stringify(recommendedAppIds))
    if (logoFile) formData.set('logo', logoFile)

    const screenshotsMeta = screenshots.map((s) =>
      s.kind === 'existing' ? { kind: 'existing', id: s.id } : { kind: 'new', tempKey: s.tempKey }
    )
    formData.set('screenshotsMeta', JSON.stringify(screenshotsMeta))
    screenshots.forEach((s) => {
      if (s.kind === 'new') formData.set(`screenshotFile:${s.tempKey}`, s.file)
    })

    formAction(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
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
        <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} required />
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

      {state.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? 'Menyimpan...' : 'Simpan'}</Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/apps')}>Batal</Button>
      </div>
    </form>
  )
}