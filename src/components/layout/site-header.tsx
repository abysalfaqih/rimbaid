import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export async function SiteHeader() {
  const t = await getTranslations("Header");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <BrandLogo label={t("homeLabel")} />
        <LocaleSwitcher label={t("languageLabel")} />
      </div>
    </header>
  );
}
