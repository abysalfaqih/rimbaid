import { notFound } from 'next/navigation'
import { getAppBySlug } from '@/lib/data/apps'
import { createAdminClient } from '@/lib/supabase/admin'
import { VerificationFlow } from '@/components/public/verification-flow'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ button?: string }>
}

export default async function DownloadVerificationPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { button: buttonId } = await searchParams

  if (!buttonId) notFound()

  const app = await getAppBySlug(slug)
  if (!app) notFound()

  // Defense in depth: pastikan button_id di URL memang milik aplikasi ini —
  // cegah orang menempelkan button_id aplikasi lain ke URL verifikasi ini
  const supabase = createAdminClient()
  const { data: button } = await supabase
    .from('download_buttons')
    .select('id, label, app_id')
    .eq('id', buttonId)
    .maybeSingle()

  if (!button || button.app_id !== app.id) notFound()

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-14">
      <VerificationFlow appName={app.name} buttonId={button.id} buttonLabel={button.label} />
    </main>
  )
}