import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * SKEMA APLIKASI.
 *
 * Aturan bisnis ditegakkan oleh DATABASE (CHECK, UNIQUE, trigger di migrasi "hardening"),
 * bukan hanya oleh kode, supaya tak ada jalan pintas yang bisa melanggarnya.
 *
 * Catatan gaya (agar mudah naik ke Drizzle 1.0 nanti): nama kolom snake_case ditulis
 * eksplisit, tanpa opsi `casing`, dan tanpa Relational Queries.
 *
 * Berkas ini dibaca oleh drizzle-kit di luar Next.js: pakai impor RELATIF saja (tanpa `@/`)
 * dan jangan mengimpor "server-only".
 */

/** Batas dari spesifikasi produk. Dipakai oleh CHECK di bawah dan oleh kode admin nanti. */
export const LIMITS = {
  screenshots: 8,
  downloadButtons: 3,
  recommendations: 3,
} as const;

export const APP_STATUSES = ["draft", "published"] as const;
export type AppStatus = (typeof APP_STATUSES)[number];

/** Kolom waktu (dengan zona waktu), wajib terisi, bawaan: saat baris dibuat. */
const nowTz = (column: string) => timestamp(column, { withTimezone: true }).notNull().defaultNow();

/* ------------------------------------------------------------------ apps */

export const apps = pgTable(
  "apps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Dibuat otomatis dari nama dan TIDAK bisa diubah (dijaga trigger). */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** Lokasi logo di penyimpanan gambar (diisi di Fase 4). */
    logoPath: text("logo_path"),
    /** Teks bebas untuk tampilan, mis. "24 MB". */
    sizeLabel: text("size_label"),
    version: text("version"),
    descriptionId: text("description_id").notNull().default(""),
    descriptionEn: text("description_en").notNull().default(""),
    status: text("status").$type<AppStatus>().notNull().default("draft"),
    /** "New Update" di beranda. Hanya satu aplikasi yang boleh true. */
    isFeatured: boolean("is_featured").notNull().default(false),
    /** Diisi otomatis (trigger) saat pertama kali berstatus published. */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: nowTz("created_at"),
    updatedAt: nowTz("updated_at"),
  },
  (t) => [
    unique("apps_slug_key").on(t.slug),
    check(
      "apps_slug_format",
      sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(${t.slug}) <= 80`,
    ),
    check("apps_name_length", sql`char_length(btrim(${t.name})) BETWEEN 1 AND 80`),
    check("apps_logo_path_length", sql`${t.logoPath} IS NULL OR char_length(${t.logoPath}) <= 300`),
    check(
      "apps_size_label_length",
      sql`${t.sizeLabel} IS NULL OR char_length(btrim(${t.sizeLabel})) BETWEEN 1 AND 20`,
    ),
    check(
      "apps_version_length",
      sql`${t.version} IS NULL OR char_length(btrim(${t.version})) BETWEEN 1 AND 30`,
    ),
    check(
      "apps_description_length",
      sql`char_length(${t.descriptionId}) <= 5000 AND char_length(${t.descriptionEn}) <= 5000`,
    ),
    check("apps_status_valid", sql`${t.status} IN ('draft', 'published')`),
    // Aplikasi yang tayang WAJIB lengkap: tak mungkin ada halaman publik yang bolong.
    check(
      "apps_published_complete",
      sql`${t.status} = 'draft' OR (
        ${t.logoPath} IS NOT NULL
        AND ${t.sizeLabel} IS NOT NULL
        AND ${t.version} IS NOT NULL
        AND btrim(${t.descriptionId}) <> ''
        AND btrim(${t.descriptionEn}) <> ''
        AND ${t.publishedAt} IS NOT NULL
      )`,
    ),
    check(
      "apps_featured_requires_published",
      sql`NOT ${t.isFeatured} OR ${t.status} = 'published'`,
    ),
    // Jaring pengaman terakhir: paling banyak satu "New Update". Trigger yang menurunkan
    // yang lama ada di migrasi "hardening".
    uniqueIndex("apps_single_featured_idx")
      .on(t.isFeatured)
      .where(sql`${t.isFeatured}`),
    // Daftar aplikasi di beranda: terbaru dulu, hanya yang tayang.
    index("apps_published_at_idx")
      .on(t.publishedAt.desc())
      .where(sql`${t.status} = 'published'`),
  ],
).enableRLS();

/* ------------------------------------------------------- app_screenshots */

export const appScreenshots = pgTable(
  "app_screenshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    /** Urutan tampil, 0 s.d. 7. Rentang + UNIQUE = paling banyak 8 per aplikasi. */
    position: smallint("position").notNull(),
    path: text("path").notNull(),
    /** Ukuran asli gambar, agar tata letak tidak melompat saat gambar dimuat. */
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: nowTz("created_at"),
  },
  (t) => [
    unique("app_screenshots_app_position_key").on(t.appId, t.position),
    check(
      "app_screenshots_position_range",
      sql`${t.position} >= 0 AND ${t.position} < ${sql.raw(String(LIMITS.screenshots))}`,
    ),
    check("app_screenshots_path_length", sql`char_length(${t.path}) BETWEEN 1 AND 300`),
    check(
      "app_screenshots_dimensions",
      sql`${t.width} BETWEEN 1 AND 10000 AND ${t.height} BETWEEN 1 AND 10000`,
    ),
  ],
).enableRLS();

/* ---------------------------------------------------------- app_downloads */

/**
 * TABEL PRIVAT: berisi tautan unduhan asli.
 * Tautan tidak boleh sampai ke browser kecuali lewat gerbang verifikasi (Fase 6).
 * ATURAN KODE: kueri halaman publik TIDAK PERNAH memilih kolom `url` dari tabel ini
 * (pilih kolom satu per satu, jangan `select()` tanpa argumen).
 */
export const appDownloads = pgTable(
  "app_downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    /** Urutan tombol, 0 s.d. 2. Rentang + UNIQUE = paling banyak 3 per aplikasi. */
    position: smallint("position").notNull(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    createdAt: nowTz("created_at"),
    updatedAt: nowTz("updated_at"),
  },
  (t) => [
    unique("app_downloads_app_position_key").on(t.appId, t.position),
    check(
      "app_downloads_position_range",
      sql`${t.position} >= 0 AND ${t.position} < ${sql.raw(String(LIMITS.downloadButtons))}`,
    ),
    check("app_downloads_label_length", sql`char_length(btrim(${t.label})) BETWEEN 1 AND 40`),
    // Hanya https, tanpa spasi. Menolak http://, javascript:, data:, ftp:, dan sejenisnya.
    check(
      "app_downloads_url_format",
      sql`${t.url} ~ '^https://[^[:space:]]+$' AND char_length(${t.url}) <= 2048`,
    ),
  ],
).enableRLS();

/* ------------------------------------------------------ app_recommendations */

export const appRecommendations = pgTable(
  "app_recommendations",
  {
    appId: uuid("app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    recommendedAppId: uuid("recommended_app_id")
      .notNull()
      .references(() => apps.id, { onDelete: "cascade" }),
    /** Urutan, 0 s.d. 2. Kunci utama (app_id, position) = paling banyak 3 per aplikasi. */
    position: smallint("position").notNull(),
    createdAt: nowTz("created_at"),
  },
  (t) => [
    primaryKey({ name: "app_recommendations_pkey", columns: [t.appId, t.position] }),
    unique("app_recommendations_pair_key").on(t.appId, t.recommendedAppId),
    check(
      "app_recommendations_position_range",
      sql`${t.position} >= 0 AND ${t.position} < ${sql.raw(String(LIMITS.recommendations))}`,
    ),
    check("app_recommendations_not_self", sql`${t.appId} <> ${t.recommendedAppId}`),
    // Mempercepat penghapusan berantai saat sebuah aplikasi dihapus.
    index("app_recommendations_recommended_idx").on(t.recommendedAppId),
  ],
).enableRLS();

export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
export type AppScreenshot = typeof appScreenshots.$inferSelect;
export type AppDownload = typeof appDownloads.$inferSelect;
export type AppRecommendation = typeof appRecommendations.$inferSelect;
