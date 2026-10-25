import type { routing } from "@/i18n/routing";
import type messages from "../../messages/id.json";

/**
 * Memberi tipe pada next-intl: kunci terjemahan salah ketik menjadi error saat typecheck,
 * dan bahasa hanya boleh "id" atau "en". Bentuk pesan mengikuti bahasa utama (id.json);
 * paritas dengan en.json dijaga oleh `pnpm i18n:check`.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
