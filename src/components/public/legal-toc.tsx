'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type TocItem = { id: string; title: string }

export function LegalToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // Bagian dianggap "aktif" saat berada di sekitar sepertiga atas layar,
      // di bawah header yang menempel.
      { rootMargin: '-96px 0px -60% 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  return (
    <>
      {/* HP & tablet: menu lipat, tanpa JavaScript tambahan */}
      <details className="rounded-lg border border-border px-4 py-3 text-sm lg:hidden print:hidden">
        <summary className="cursor-pointer font-medium">Daftar isi</summary>
        <ol className="mt-3 space-y-2 text-muted-foreground">
          {items.map((item, index) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="hover:text-foreground">
                <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </details>

      {/* Desktop: menempel di samping, bagian aktif ditandai */}
      <nav
        aria-label="Daftar isi"
        className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block print:hidden"
      >
        <p className="mb-3 text-sm font-medium">Daftar isi</p>
        <ol className="border-l border-border text-sm">
          {items.map((item, index) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active === item.id ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l py-1.5 pl-4 transition-colors',
                  active === item.id
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="mr-2 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}