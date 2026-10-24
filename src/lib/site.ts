import { publicEnv } from "@/lib/env/public";

/** Konfigurasi situs yang dipakai bersama (metadata, sitemap, Open Graph, dan lain-lain). */
export const siteConfig = {
  name: "Rimba ID",
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  description: {
    id: "Tempat berbagi aplikasi buatan sendiri. Temukan dan unduh aplikasi terbaru dari Rimba ID.",
    en: "A home for apps built by one developer. Discover and download the latest apps from Rimba ID.",
  },
} as const;

/** Membuat URL absolut dari path, contoh: absoluteUrl("/en/apps") */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
