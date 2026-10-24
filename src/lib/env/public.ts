import { z } from "zod";

/**
 * Variabel environment PUBLIK (boleh dibaca browser).
 *
 * Nilainya ditanam ke bundle saat build, jadi JANGAN pernah menaruh rahasia di sini.
 * Rahasia ada di `./server.ts`.
 *
 * Catatan teknis: Next.js hanya mengganti akses literal `process.env.NEXT_PUBLIC_X`.
 * Karena itu setiap variabel ditulis satu per satu di `parsePublicEnv()` dan tidak boleh
 * di-spread dari `process.env`.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url({ error: "harus berupa URL lengkap, contoh: https://rimba-id.vercel.app" })
    .transform((value) => value.replace(/\/+$/, ""))
    .refine((value) => new URL(value).origin === value, {
      error: "hanya boleh origin (tanpa path, query, atau slash di akhir)",
    })
    .refine((value) => value.startsWith("https://") || value.startsWith("http://localhost"), {
      error: "wajib https:// (http:// hanya diizinkan untuk localhost)",
    }),
});

export type PublicEnv = z.infer<typeof publicSchema>;

function parsePublicEnv(): PublicEnv {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!result.success) {
    throw new Error(
      `Konfigurasi environment publik tidak valid:\n${z.prettifyError(result.error)}\n` +
        "Periksa .env.local (lokal) atau Environment Variables di Vercel. Contoh ada di .env.example.",
    );
  }

  return result.data;
}

export const publicEnv = parsePublicEnv();
