import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Rimba<span className="text-primary">ID</span>
        </Link>
      </div>
    </header>
  )
}