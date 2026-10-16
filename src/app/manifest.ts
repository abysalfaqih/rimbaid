import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rimba ID',
    short_name: 'RimbaID',
    description: 'Kumpulan aplikasi yang saya buat sendiri, tersedia untuk diunduh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#eef0e9',
    theme_color: '#2f5c46',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}