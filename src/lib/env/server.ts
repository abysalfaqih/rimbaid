import "server-only";
import { z } from "zod";

/**
 * Variabel environment SERVER-ONLY (boleh berisi rahasia).
 *
 * `import "server-only"` membuat build GAGAL jika file ini tidak sengaja ikut diimpor
 * dari Client Component, sehingga rahasia tidak mungkin bocor ke browser.
 *
 * Variabel rahasia ditambahkan bertahap di fase berikutnya
 * (database, Supabase service role, secret sesi verifikasi, dan lain-lain).
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/** Membaca dan memvalidasi env server satu kali, lalu menyimpannya. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const result = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  if (!result.success) {
    throw new Error(
      `Konfigurasi environment server tidak valid:\n${z.prettifyError(result.error)}\n` +
        "Periksa .env.local (lokal) atau Environment Variables di Vercel.",
    );
  }

  cached = result.data;
  return cached;
}
