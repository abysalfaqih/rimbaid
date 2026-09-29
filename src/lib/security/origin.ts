import 'server-only'

// Mencegah situs LAIN memanggil API verifikasi kita langsung dari browser
// pengunjung mereka. Bukan proteksi CSRF penuh (endpoint ini memang publik/
// tanpa sesi), tapi menutup jalur penyalahgunaan lintas-situs yang murah.
export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true // navigasi langsung/non-browser, divalidasi logika sesi sendiri
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) return true
  try {
    return new URL(origin).host === new URL(siteUrl).host
  } catch {
    return false
  }
}