import Image from 'next/image'
import Link from 'next/link'

type AppTileProps = {
  slug: string
  name: string
  logoUrl: string | null
}

export function AppTile({ slug, name, logoUrl }: AppTileProps) {
  return (
    <Link
      href={`/apps/${slug}`}
      className="group flex flex-col items-center gap-3 rounded-lg text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative size-24 overflow-hidden rounded-[22%] border border-border bg-muted">
        {logoUrl ? (
          <Image src={logoUrl} alt={`Logo ${name}`} fill className="object-cover" sizes="96px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="line-clamp-2 w-full font-display text-sm font-semibold leading-snug group-hover:text-primary">
        {name}
      </span>
    </Link>
  )
}