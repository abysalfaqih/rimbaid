import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import figure from "@/assets/brand/logo-figure.webp";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return buildPageMetadata({
    locale,
    path: "/",
    absoluteTitle: t("homeTitle"),
    description: t("description"),
    imageAlt: t("ogAlt"),
  });
}

/** Beranda sementara (Fase 1). Isi sebenarnya — New Update dan daftar aplikasi — dibuat di Fase 5. */
export default async function HomePage() {
  const t = await getTranslations("Home");

  return (
    <section className="relative isolate overflow-hidden hero-glow">
      <div className="container-page grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-20">
        <div className="order-2 lg:order-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised px-3.5 py-1.5 text-xs font-semibold tracking-[0.16em] text-gold uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-flame" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1 className="mt-5 text-5xl leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">{t("description")}</p>
        </div>

        <div className="order-1 mx-auto w-44 sm:w-60 lg:order-2 lg:mx-0 lg:ml-auto lg:w-full lg:max-w-sm">
          <Image
            src={figure}
            alt={t("imageAlt")}
            priority
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 240px, 176px"
            className="h-auto w-full fade-bottom"
          />
        </div>
      </div>
    </section>
  );
}
