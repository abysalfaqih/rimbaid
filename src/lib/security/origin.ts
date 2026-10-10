import 'server-only'

// Mencegah situs LAIN memanggil API verifikasi kita dari browser pengunjung
// mereka. Origin request harus sama dengan host yang sedang melayani request
// ini, jadi tidak bergantung pada env var dan aman untuk banyak domain
// (domain utama, *.vercel.app, preview).
export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true // navigasi langsung/non-browser, divalidasi logika sesi sendiri

  const host = request.headers.get('host') ?? request.headers.get('x-forwarded-host')
  if (!host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}