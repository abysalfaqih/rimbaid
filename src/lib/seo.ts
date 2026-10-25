import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { absoluteUrl, siteConfig } from "@/lib/site";

const OPEN_GRAPH_LOCALE: Record<Locale, string> = { id: "id_ID", en: "en_US" };

type PageMetadataInput = {
  locale: Locale;
  /** Path TANPA prefix bahasa, contoh: "/" atau "/apps/nama-aplikasi". */
  path: string;
  /** Judul halaman. Jika kosong, `absoluteTitle` dipakai apa adanya. */
  title?: string;
  /** Judul lengkap tanpa template (untuk beranda). */
  absoluteTitle?: string;
  description: string;
  imageAlt: string;
  /** Path gambar OG (di /public). Bawaan: gambar umum situs. */
  image?: string;
};

/**
 * Membuat metadata lengkap satu halaman: judul, canonical, hreflang, Open Graph, Twitter.
 *
 * Dipanggil dari `generateMetadata` di setiap halaman. canonical/hreflang SENGAJA tidak diset
 * di layout, karena akan diwariskan ke semua halaman dan membuat semuanya menunjuk ke beranda.
 * Catatan: Next.js tidak menggabungkan `openGraph` secara mendalam, jadi blok ini selalu lengkap.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  absoluteTitle,
  description,
  imageAlt,
  image = "/og/default.jpg",
}: PageMetadataInput): Metadata {
  const urlFor = (target: Locale) => absoluteUrl(getPathname({ locale: target, href: path }));

  const languages: Record<string, string> = {};
  for (const target of routing.locales) languages[target] = urlFor(target);
  languages["x-default"] = urlFor(routing.defaultLocale);

  const resolvedTitle = absoluteTitle ?? title ?? siteConfig.name;
  const images = [{ url: image, width: 1200, height: 630, alt: imageAlt }];

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: urlFor(locale), languages },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: OPEN_GRAPH_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((other) => other !== locale)
        .map((other) => OPEN_GRAPH_LOCALE[other]),
      url: urlFor(locale),
      title: resolvedTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: images.map(({ url, alt }) => ({ url, alt })),
    },
  };
}
