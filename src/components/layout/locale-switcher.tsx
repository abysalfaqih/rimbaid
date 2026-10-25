"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Nama bahasa selalu ditulis dalam bahasanya sendiri, supaya dikenali siapa pun. */
const LANGUAGES = {
  id: { short: "ID", name: "Bahasa Indonesia" },
  en: { short: "EN", name: "English" },
} as const;

/**
 * Pengganti bahasa. Berupa tautan biasa (bukan tombol JavaScript), jadi tetap berfungsi
 * tanpa JS dan bisa diikuti mesin pencari untuk menemukan versi bahasa lain.
 */
export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={label}>
      <ul className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
        {routing.locales.map((target) => {
          const active = target === locale;
          return (
            <li key={target}>
              <Link
                href={pathname}
                locale={target}
                lang={target}
                hrefLang={target}
                aria-label={LANGUAGES[target].name}
                aria-current={active ? "true" : undefined}
                className={`inline-flex h-9 min-w-11 items-center justify-center rounded-full px-3 text-sm font-bold tracking-wide transition-colors ${
                  active ? "bg-gold text-canvas" : "text-fg-muted hover:text-fg"
                }`}
              >
                {LANGUAGES[target].short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
