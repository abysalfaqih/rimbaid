import { publicEnv } from "@/lib/env/public";

/**
 * Konfigurasi situs yang dipakai bersama (metadata, sitemap, Open Graph, dan lain-lain).
 * Teks yang tampil ke pengunjung ada di `messages/*.json`, bukan di sini.
 */
export const siteConfig = {
  name: "Rimba ID",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  /** Tahun pertama hak cipta. Tetap (bukan tahun berjalan) agar halaman bisa dirender statis. */
  foundedYear: 2026,
} as const;

/** Membuat URL absolut dari path, contoh: absoluteUrl("/en/apps") */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
