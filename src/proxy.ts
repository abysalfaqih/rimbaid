import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Proxy (dulu bernama "middleware" sebelum Next.js 16).
 * Saat ini hanya menangani routing bahasa. Fase berikutnya menambah perlindungan /admin
 * dan gerbang verifikasi unduhan.
 */
export default createMiddleware(routing);

export const config = {
  // Cocokkan semua path kecuali:
  // - yang diawali `/api`, `/trpc`, `/_next`, atau `/_vercel`
  // - yang mengandung titik (berkas statis seperti favicon.ico, sitemap.xml)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
