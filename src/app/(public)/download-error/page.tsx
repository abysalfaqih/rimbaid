import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DownloadErrorPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">Verifikasi Tidak Valid</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sesi verifikasi sudah kedaluwarsa, sudah dipakai, atau tidak sah. Silakan kembali ke halaman aplikasi dan mulai proses download dari awal.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </main>
  )
}