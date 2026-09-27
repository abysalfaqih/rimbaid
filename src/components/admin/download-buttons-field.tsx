'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_DOWNLOAD_BUTTONS } from '@/lib/validations/app'

export type DownloadButtonItem = { label: string; url: string }

export function DownloadButtonsField({
  value,
  onChange,
}: {
  value: DownloadButtonItem[]
  onChange: (next: DownloadButtonItem[]) => void
}) {
  function updateItem(index: number, patch: Partial<DownloadButtonItem>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }
  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <Label>Tombol Download</Label>
      {value.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input placeholder="Nama tombol" value={item.label} onChange={(e) => updateItem(index, { label: e.target.value })} />
          <Input placeholder="https://..." value={item.url} onChange={(e) => updateItem(index, { url: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < MAX_DOWNLOAD_BUTTONS && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: '', url: '' }])}>
          <Plus className="mr-1 size-4" /> Tambah tombol ({value.length}/{MAX_DOWNLOAD_BUTTONS})
        </Button>
      )}
    </div>
  )
}