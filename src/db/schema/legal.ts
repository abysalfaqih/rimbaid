import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Halaman legal yang bisa diedit di admin (Fase 7), dua bahasa WAJIB.
 * Tiga baris tetap (terms, privacy, disclaimer) dibuat oleh migrasi "hardening";
 * admin hanya mengubah isinya, tidak menambah atau menghapus baris.
 * Isi ditulis sebagai Markdown biasa dan dirender tanpa HTML mentah (aman dari XSS).
 */
export const LEGAL_SLUGS = ["terms", "privacy", "disclaimer"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const legalPages = pgTable(
  "legal_pages",
  {
    slug: text("slug").$type<LegalSlug>().primaryKey(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    bodyId: text("body_id").notNull(),
    bodyEn: text("body_en").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "legal_pages_slug_valid",
      sql`${t.slug} IN (${sql.raw(LEGAL_SLUGS.map((slug) => `'${slug}'`).join(", "))})`,
    ),
    check(
      "legal_pages_title_length",
      sql`char_length(btrim(${t.titleId})) BETWEEN 1 AND 120 AND char_length(btrim(${t.titleEn})) BETWEEN 1 AND 120`,
    ),
    check(
      "legal_pages_body_length",
      sql`char_length(btrim(${t.bodyId})) BETWEEN 1 AND 100000 AND char_length(btrim(${t.bodyEn})) BETWEEN 1 AND 100000`,
    ),
  ],
).enableRLS();

export type LegalPage = typeof legalPages.$inferSelect;
