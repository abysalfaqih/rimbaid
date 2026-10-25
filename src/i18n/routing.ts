import { defineRouting } from "next-intl/routing";

/**
 * Konfigurasi bahasa — satu-satunya sumber kebenaran untuk proxy, navigasi, dan SEO.
 *
 * - Indonesia di URL utama (`/apps`), Inggris di `/en/apps`.
 * - `localeDetection: false`: bahasa ditentukan HANYA oleh URL. Pengunjung tidak dialihkan
 *   otomatis berdasarkan bahasa browser (Google menyarankan ini, dan halaman jadi mudah
 *   di-cache). Pengunjung berganti bahasa lewat tombol ID/EN.
 * - `localeCookie: false`: tidak ada cookie bahasa, jadi situs publik bebas cookie.
 * - `alternateLinks: false`: tag hreflang kita buat sendiri di metadata (lihat `lib/seo.ts`)
 *   dengan URL absolut dari NEXT_PUBLIC_SITE_URL, supaya tidak bergantung pada host request.
 */
export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});
