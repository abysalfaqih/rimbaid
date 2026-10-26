import { notFound } from "next/navigation";

// Halaman ini tidak pernah menampilkan konten: satu-satunya tugasnya melempar 404.
// Validasi "navigasi instan" di mode dev tak bisa memeriksa halaman yang sengaja gagal render,
// sehingga memunculkan galat palsu. Kita kecualikan hanya segmen ini.
export const instant = false;

/**
 * Penangkap semua URL yang tidak dikenal di dalam sebuah bahasa (mis. /en/xyz).
 * Tanpa ini, Next.js menampilkan 404 bawaan tanpa layout dan tanpa bahasa.
 */
export default function CatchAllPage() {
  notFound();
}
