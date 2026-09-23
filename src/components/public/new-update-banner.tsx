import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

type NewUpdateBannerProps = {
  slug: string
  name: string
  logoUrl: string | null
  description: string
  version?: string | null
}

export function NewUpdateBanner({ slug, name, logoUrl, description, version }: NewUpdateBannerProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:flex-row sm:items-center sm:p-8"
    >
      <Badge className="absolute right-4 top-4 bg-accent text-accent-foreground sm:static sm:order-2">
        New Update
      </Badge>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:h-24 sm:w-24">
        {logoUrl ? (
          <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" sizes="96px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 sm:order-1">
        <h2 className="text-xl font-bold group-hover:text-primary sm:text-2xl">{name}</h2>
        {version && <p className="text-sm text-muted-foreground">Versi {version}</p>}
        <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}