import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Rimba<span className="text-primary">ID</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}