import { z } from 'zod'

export const MAX_DOWNLOAD_BUTTONS = 3
export const MAX_SCREENSHOTS = 6
export const MAX_RECOMMENDATIONS = 3

export const downloadButtonSchema = z.object({
  label: z.string().trim().min(1, 'Nama tombol wajib diisi').max(50, 'Maksimal 50 karakter'),
  url: z.string().trim().url('URL tidak valid, harus diawali http:// atau https://'),
})

export const appDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Nama aplikasi wajib diisi').max(100, 'Maksimal 100 karakter'),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi').max(5000, 'Maksimal 5000 karakter'),
  sizeLabel: z.string().trim().max(50).optional(),
  version: z.string().trim().max(50).optional(),
  isPublished: z.boolean(),
  isNewUpdate: z.boolean(),
  downloadButtons: z
    .array(downloadButtonSchema)
    .min(1, 'Minimal 1 tombol download')
    .max(MAX_DOWNLOAD_BUTTONS, `Maksimal ${MAX_DOWNLOAD_BUTTONS} tombol download`),
  recommendedAppIds: z.array(z.string().uuid()).max(MAX_RECOMMENDATIONS, `Maksimal ${MAX_RECOMMENDATIONS} rekomendasi`),
})

export type AppDetailsInput = z.infer<typeof appDetailsSchema>