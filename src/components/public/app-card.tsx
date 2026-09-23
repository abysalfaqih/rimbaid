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
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/5"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {logoUrl ? (
            <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight group-hover:text-primary">{name}</h3>
          {version && <span className="text-xs text-muted-foreground">v{version}</span>}
        </div>
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}