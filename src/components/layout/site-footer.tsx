import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/lib/site";

export async function SiteFooter() {
  const t = await getTranslations("Footer");

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-8 text-sm text-fg-muted">
        <p>{t("copyright", { year: siteConfig.foundedYear })}</p>
      </div>
    </footer>
  );
}
