'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LogoUploader({
  initialUrl,
  onChange,
}: {
  initialUrl?: string | null
  onChange: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null)

  function handleFile(file: File | null) {
    onChange(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : initialUrl ?? null)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
        {previewUrl ? (
          <Image src={previewUrl} alt="Logo" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImagePlus className="size-6" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          {previewUrl ? 'Ganti logo' : 'Unggah logo'}
        </Button>
        <p className="text-xs text-muted-foreground">PNG/JPG/WEBP/SVG, maks 2MB</p>
      </div>
    </div>
  )
}