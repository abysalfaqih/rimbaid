import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Halaman 404 berbahasa, tampil di dalam layout (header + footer) bahasa aktif. */
export default async function NotFoundPage() {
  const t = await getTranslations("NotFound");

  return (
    <section className="container-page flex flex-1 flex-col items-start justify-center gap-5 py-24">
      <p className="text-sm font-semibold tracking-[0.16em] text-gold uppercase">{t("code")}</p>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t("title")}</h1>
      <p className="max-w-md text-lg text-fg-muted">{t("description")}</p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-full bg-gold px-6 font-semibold text-canvas transition-colors hover:bg-gold-hi"
      >
        {t("back")}
      </Link>
    </section>
  );
}
