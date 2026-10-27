import { defineConfig } from "drizzle-kit";

/**
 * Konfigurasi drizzle-kit: hanya menunjuk lokasi skema dan folder migrasi.
 *
 * URL database untuk migrasi diberikan oleh `scripts/db.mjs` lewat DATABASE_MIGRATION_URL
 * (berisi pengaman untuk produksi). Jangan menjalankan `drizzle-kit migrate` langsung.
 * `generate` dan `check` tidak butuh database.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_MIGRATION_URL ?? "" },
});
