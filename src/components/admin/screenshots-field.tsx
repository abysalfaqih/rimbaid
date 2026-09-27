'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { MAX_SCREENSHOTS } from '@/lib/validations/app'

export type ScreenshotItem =
  | { tempKey: string; kind: 'existing'; id: string; previewUrl: string }
  | { tempKey: string; kind: 'new'; file: File; previewUrl: string }

export function ScreenshotsField({
  value,
  onChange,
}: {
  value: ScreenshotItem[]
  onChange: (next: ScreenshotItem[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | null) {
    if (!files) return
    const room = MAX_SCREENSHOTS - value.length
    const picked = Array.from(files).slice(0, room)
    const newItems: ScreenshotItem[] = picked.map((file) => ({
      tempKey: crypto.randomUUID(),
      kind: 'new',
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    onChange([...value, ...newItems])
  }

  return (
    <div className="space-y-3">
      <Label>Screenshot</Label>
      <div className="flex flex-wrap gap-3">
        {value.map((item) => (
          <div key={item.tempKey} className="relative h-28 w-20 overflow-hidden rounded-lg border border-border bg-muted">
            <Image src={item.previewUrl} alt="Screenshot" fill className="object-cover" sizes="80px" />
            <button
              type="button"
              onClick={() => onChange(value.filter((i) => i.tempKey !== item.tempKey))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              aria-label="Hapus screenshot"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}

        {value.length < MAX_SCREENSHOTS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            <Plus className="size-5" />
            <span className="text-xs">{value.length}/{MAX_SCREENSHOTS}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}