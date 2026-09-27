import Image from 'next/image'
import Link from 'next/link'

type AppCardProps = {
  slug: string
  name: string
  logoUrl: string | null
  description: string
  version?: string | null
}

export function AppCard({ slug, name, logoUrl, description, version }: AppCardProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group flex items-center gap-4 py-4 transition-colors hover:bg-secondary/40"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {logoUrl ? (
          <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-base text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-display text-base font-semibold group-hover:text-primary">{name}</h3>
          {version && <span className="shrink-0 text-xs text-muted-foreground">v{version}</span>}
        </div>
        <p className="truncate text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}