import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { routing } from "@/i18n/routing";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { siteConfig } from "@/lib/site";
import "../globals.css";

/** Bangun semua bahasa saat build, sehingga halaman disajikan statis (cepat dan ramah SEO). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Metadata dasar yang berlaku untuk semua halaman.
 * canonical, hreflang, dan Open Graph SENGAJA tidak di sini — lihat `buildPageMetadata`.
 */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0A0908",
  colorScheme: "dark",
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Common" });

  return (
    <html
      lang={locale}
      className={`${fontBody.variable} ${fontDisplay.variable} h-full font-sans antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Komponen klien hanya menerima pesan yang mereka butuhkan (kini: tidak ada) */}
        <NextIntlClientProvider messages={{}}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:font-semibold focus:text-canvas"
          >
            {t("skipToContent")}
          </a>
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
