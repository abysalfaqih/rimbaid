import { headers } from 'next/headers'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Google_Sans, Roboto } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const siteDescription =
  'Unduh APK Mod terbaik untuk Android di Rimba ID. Kami menyediakan mod yang 100% berfungsi, aman, dan gratis untuk game-game populer. Tidak memerlukan root.'

// Judul, tombol, nama aplikasi (seperti Play Store)
const googleSans = Google_Sans({
  subsets: ['latin'],
  variable: '--font-google-sans',
  fallback: ['system-ui', 'arial'],
})

// Teks isi (seperti Play Store)
const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Rimba ID',
    template: '%s — Rimba ID',
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: 'Rimba ID',
    locale: 'id_ID',
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    description: siteDescription,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#eef0e9' },
    { media: '(prefers-color-scheme: dark)', color: '#101712' },
  ],
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${googleSans.variable} ${roboto.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}