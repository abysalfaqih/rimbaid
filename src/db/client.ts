import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env/server";

/** Koneksi ke komputer sendiri tidak memakai TLS; semua host lain WAJIB terenkripsi. */
function isLocalHost(url: string): boolean {
  const { hostname } = new URL(url);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function createDatabase() {
  const { DATABASE_URL } = getServerEnv();

  const client = postgres(DATABASE_URL, {
    // Transaction pooler Supabase tidak mendukung prepared statement.
    prepare: false,
    // Satu koneksi per instance fungsi; pooler Supabase yang membagi koneksi ke database.
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    // "require" = terenkripsi (TLS) tanpa memverifikasi sertifikat. Verifikasi penuh
    // dengan CA Supabase dievaluasi di fase pengerasan keamanan.
    ssl: isLocalHost(DATABASE_URL) ? false : "require",
  });

  return drizzle({ client });
}

export type Database = ReturnType<typeof createDatabase>;

// Disimpan di globalThis agar hot-reload saat `pnpm dev` tidak membuka koneksi baru
// setiap kali berkas disimpan.
const globalForDb = globalThis as typeof globalThis & { __rimbaDb?: Database };

/**
 * Mengambil koneksi database. Dibuat saat pertama dipanggil (bukan saat modul diimpor),
 * sehingga `next build` tidak butuh DATABASE_URL dan tidak pernah menyentuh database.
 * Hanya boleh dipakai di kode server (Server Component, Server Action, Route Handler).
 */
export function getDb(): Database {
  globalForDb.__rimbaDb ??= createDatabase();
  return globalForDb.__rimbaDb;
}
