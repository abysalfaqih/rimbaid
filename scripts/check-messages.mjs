// Penjaga paritas terjemahan: semua bahasa wajib punya kunci dan placeholder yang sama
// dengan bahasa acuan. Dijalankan lewat `pnpm i18n:check` (dan otomatis di `pnpm check`).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REFERENCE = "id";
const dir = join(process.cwd(), "messages");

/** Meratakan objek bersarang menjadi Map { "Home.title" => "teks" }. */
function flatten(value, prefix = "", out = new Map()) {
  for (const [key, v] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (v !== null && typeof v === "object") flatten(v, path, out);
    else out.set(path, String(v));
  }
  return out;
}

/** Nama placeholder ICU, mis. "© {year}" => "year". Cukup untuk pola yang kita pakai. */
function placeholders(text) {
  const names = new Set();
  for (const match of text.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)) names.add(match[1]);
  return [...names].sort().join(", ");
}

const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
const load = (locale) => flatten(JSON.parse(readFileSync(join(dir, `${locale}.json`), "utf8")));

if (!files.includes(`${REFERENCE}.json`)) {
  console.error(`Berkas acuan messages/${REFERENCE}.json tidak ditemukan.`);
  process.exit(1);
}

const reference = load(REFERENCE);
const problems = [];

for (const file of files) {
  const locale = file.replace(/\.json$/, "");
  const messages = load(locale);

  for (const [key, text] of messages) {
    if (text.trim() === "") problems.push(`[${locale}] kosong: ${key}`);
  }
  if (locale === REFERENCE) continue;

  for (const key of reference.keys()) {
    if (!messages.has(key)) problems.push(`[${locale}] kunci hilang: ${key}`);
  }
  for (const key of messages.keys()) {
    if (!reference.has(key)) problems.push(`[${locale}] kunci berlebih: ${key}`);
  }
  for (const [key, text] of messages) {
    const refText = reference.get(key);
    if (refText !== undefined && placeholders(text) !== placeholders(refText)) {
      problems.push(
        `[${locale}] placeholder berbeda di ${key}: "${placeholders(text)}" ≠ "${placeholders(refText)}"`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(`Pesan terjemahan tidak konsisten (${problems.length} masalah):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `Pesan konsisten: ${files.length} bahasa, ${reference.size} kunci per bahasa (acuan: ${REFERENCE}).`,
);
