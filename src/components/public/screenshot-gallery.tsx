'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

type Screenshot = { id: string; image_url: string }

export function ScreenshotGallery({
  screenshots,
  appName,
}: {
  screenshots: Screenshot[]
  appName: string
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {screenshots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="relative h-40 w-72 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
          >
            <Image
              src={shot.image_url}
              alt={`Screenshot ${appName} ${index + 1}`}
              fill
              className="object-cover"
              sizes="288px"
            />
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white"
            onClick={() => setActiveIndex(null)}
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
          <div className="relative h-[70vh] w-full max-w-3xl">
            <Image
              src={screenshots[activeIndex].image_url}
              alt={`Screenshot ${appName} ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  )
}