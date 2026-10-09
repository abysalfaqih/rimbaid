import { AppForm } from '@/components/admin/app-form'
import { createApp } from '../actions'
import { getRecommendationOptions } from '@/lib/data/apps'

export default async function NewAppPage() {
  const recommendationOptions = await getRecommendationOptions()

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="mb-8 font-display text-2xl font-semibold">Tambah Aplikasi</h1>
      <AppForm action={createApp} recommendationOptions={recommendationOptions} />
    </div>
  )
}