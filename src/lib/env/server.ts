import "server-only";
import { z } from "zod";

/**
 * Variabel environment SERVER-ONLY (boleh berisi rahasia).
 *
 * `import "server-only"` membuat build GAGAL jika file ini tidak sengaja ikut diimpor
 * dari Client Component, sehingga rahasia tidak mungkin bocor ke browser.
 *
 * Variabel rahasia ditambahkan bertahap di fase berikutnya
 * (Supabase service role, secret sesi verifikasi, dan lain-lain).
 */

/** Port Transaction pooler Supabase. Satu-satunya mode yang cocok untuk fungsi serverless. */
const TRANSACTION_POOLER_PORT = "6543";

function portOf(value: string): string | null {
  try {
    return new URL(value).port;
  } catch {
    return null;
  }
}

const databaseUrlSchema = z
  .string({ error: "wajib diisi (lihat .env.example)" })
  .regex(/^postgres(?:ql)?:\/\//, { error: "harus diawali postgresql://" })
  .refine((value) => !process.env.VERCEL || portOf(value) === TRANSACTION_POOLER_PORT, {
    error:
      "di Vercel wajib memakai Transaction pooler (port 6543), bukan Session pooler (5432) " +
      "atau koneksi langsung",
  });

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  DATABASE_URL: databaseUrlSchema,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/** Membaca dan memvalidasi env server satu kali, lalu menyimpannya. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const result = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
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
