import Image from 'next/image'
import Link from 'next/link'

type NewUpdateBannerProps = {
  slug: string
  name: string
  logoUrl: string | null
  description: string
  version?: string | null
}

export function NewUpdateBanner({ slug, name, logoUrl, description, version }: NewUpdateBannerProps) {
  return (
    <Link href={`/apps/${slug}`} className="group block">
      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
        Baru diperbarui
      </span>

      <div className="mt-4 flex items-start gap-4 sm:items-center">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-20">
          {logoUrl ? (
            <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" sizes="80px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-2xl text-muted-foreground">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold leading-tight group-hover:text-primary sm:text-3xl">
            {name}
          </h2>
          {version && <p className="mt-0.5 text-sm text-muted-foreground">Versi {version}</p>}
        </div>
      </div>

      <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-muted-foreground">{description}</p>

      <span className="mt-4 inline-block text-sm font-medium text-primary underline decoration-primary/30 underline-offset-4 group-hover:decoration-primary">
        Lihat detail
      </span>
    </Link>
  )
}