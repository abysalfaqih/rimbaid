import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/public/site-header'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  )
}