import { AppForm } from '@/components/admin/app-form'
import { createApp } from '../actions'
import { getRecommendationOptions } from '@/lib/data/apps'

export default async function NewAppPage() {
  const recommendationOptions = await getRecommendationOptions()

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Tambah Aplikasi</h1>
      <AppForm action={createApp} recommendationOptions={recommendationOptions} />
    </div>
  )
}