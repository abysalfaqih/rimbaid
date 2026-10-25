// Menghapus folder/berkas hasil generate (lintas platform: Windows, macOS, Linux).
// Pemakaian: node scripts/clean.mjs <path> [<path> ...]
//
// Kenapa perlu: Next.js menyimpan tipe rute di .next/dev/types. Setelah rute dipindah atau
// dihapus, tipe lama itu bisa membuat `tsc` gagal dengan error "Cannot find module".
import { rmSync } from "node:fs";

for (const target of process.argv.slice(2)) {
  rmSync(target, { recursive: true, force: true });
  console.log(`dihapus: ${target}`);
}
