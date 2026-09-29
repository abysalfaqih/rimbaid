import { headers } from 'next/headers'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Fraunces, Work_Sans } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Rimba ID — Aplikasi buatan sendiri',
    template: '%s — Rimba ID',
  },
  description: 'Kumpulan aplikasi yang saya buat sendiri, tersedia untuk diunduh.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${fraunces.variable} ${workSans.variable} font-sans antialiased`}>
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