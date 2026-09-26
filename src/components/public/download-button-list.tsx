import Link from 'next/link'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type DownloadButtonListProps = {
  slug: string
  buttons: { id: string; label: string }[]
}

export function DownloadButtonList({ slug, buttons }: DownloadButtonListProps) {
  if (buttons.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada link download untuk aplikasi ini.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
      {buttons.map((button) => (
        <Button key={button.id} asChild size="lg">
          <Link href={`/apps/${slug}/download?button=${button.id}`}>
            <Download className="mr-2 size-4" />
            {button.label}
          </Link>
        </Button>
      ))}
    </div>
  )
}