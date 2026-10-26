import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./client";

const TIMEOUT_MS = 3000;

export type DatabaseStatus = "ok" | "error";

/**
 * Hanya nama dan kode galat yang dicatat: pesan lengkap bisa memuat alamat server.
 * Drizzle membungkus galat driver, jadi kode aslinya (mis. ECONNREFUSED, 28P01 untuk sandi
 * salah) ada di rantai `cause`.
 */
function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < 3 && current instanceof Error; depth++) {
    const code = (current as { code?: unknown }).code;
    parts.push(typeof code === "string" ? `${current.name} ${code}` : current.name);
    current = current.cause;
  }

  return parts.length > 0 ? parts.join(" <- ") : "unknown";
}

/**
 * Memastikan database bisa dijangkau dan menjawab dalam batas waktu.
 * Tidak pernah melempar galat dan tidak membocorkan detail ke pemanggil.
 */
export async function checkDatabase(): Promise<DatabaseStatus> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS);
    });
    await Promise.race([getDb().execute(sql`select 1`), timeout]);
    return "ok";
  } catch (error) {
    console.error("[health] pengecekan database gagal:", describeError(error));
    return "error";
  } finally {
    clearTimeout(timer);
  }
}
