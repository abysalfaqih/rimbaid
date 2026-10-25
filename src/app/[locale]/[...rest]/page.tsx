import { notFound } from "next/navigation";

/**
 * Penangkap semua URL yang tidak dikenal di dalam sebuah bahasa (mis. /en/xyz).
 * Tanpa ini, Next.js menampilkan 404 bawaan tanpa layout dan tanpa bahasa.
 */
export default function CatchAllPage() {
  notFound();
}
