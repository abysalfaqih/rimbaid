import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/brand/logo-full.png"
            alt=""
            width={33}
            height={44}
            className="h-11 w-auto"
          />
          <span className="font-display text-xl font-semibold tracking-tight">
            Rimba<span className="text-primary">ID</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}