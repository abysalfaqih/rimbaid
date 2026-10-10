import { notFound } from 'next/navigation'
import { AppForm } from '@/components/admin/app-form'
import { updateApp } from '../../actions'
import { getAppForEdit, getRecommendationOptions } from '@/lib/data/apps'

type Props = { params: Promise<{ id: string }> }

export default async function EditAppPage({ params }: Props) {
  const { id } = await params
  const result = await getAppForEdit(id)
  if (!result) notFound()

  const { app, buttons, screenshots, recommendedAppIds } = result
  const recommendationOptions = await getRecommendationOptions(id)
  const boundUpdateApp = updateApp.bind(null, id)

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-8 font-display text-2xl font-semibold">Edit Aplikasi</h1>
      <AppForm
        action={boundUpdateApp}
        recommendationOptions={recommendationOptions}
        initialData={{
          id: app.id,
          name: app.name,
          slug: app.slug,
          description: app.description,
          sizeLabel: app.size_label ?? '',
          version: app.version ?? '',
          isPublished: app.is_published,
          isNewUpdate: app.is_new_update,
          logoUrl: app.logo_url,
          downloadButtons: buttons.map((b) => ({ label: b.label, url: b.url })),
          screenshots: screenshots.map((s) => ({ id: s.id, url: s.image_url })),
          recommendedAppIds,
        }}
      />
    </div>
  )
}