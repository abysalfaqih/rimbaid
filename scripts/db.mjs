// Skrip database: memasang migrasi dan memeriksa hasilnya, dengan pengaman.
//
//   node scripts/db.mjs migrate dev    -> pnpm db:migrate
//   node scripts/db.mjs migrate prod   -> pnpm db:migrate:prod
//   node scripts/db.mjs verify dev     -> pnpm db:verify
//   node scripts/db.mjs verify prod    -> pnpm db:verify:prod
//
// URL database dibaca dari berkas yang berbeda untuk dev dan prod, dan HANYA dari berkas
// (bukan dari variabel lingkungan terminal), sehingga tidak mungkin salah sasaran karena
// sisa variabel dari sesi sebelumnya.
//
// Migrasi memakai koneksi "Session pooler" Supabase (bukan Transaction pooler yang dipakai
// aplikasi), dan seluruh migrasi yang tertunda dijalankan dalam SATU transaksi: gagal di tengah
// jalan = tidak ada perubahan sama sekali.
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { parseEnv } from "node:util";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const VARIABLE = "DATABASE_MIGRATION_URL";
const ENV_FILES = { dev: ".env.local", prod: ".env.migrate-prod.local" };
const MIGRATIONS_FOLDER = "./drizzle";
const API_ROLES = ["anon", "authenticated", "service_role"];
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const REQUIRED_TRIGGERS = [
  "app_downloads_set_updated_at",
  "apps_featured_exclusive",
  "apps_published_at_auto",
  "apps_set_updated_at",
  "apps_slug_immutable",
  "legal_pages_set_updated_at",
];
const REQUIRED_LEGAL_SLUGS = ["disclaimer", "privacy", "terms"];

class UserError extends Error {}

function fail(message) {
  throw new UserError(message);
}

/* ------------------------------------------------------------ membaca target */

function readUrlFromFile(target, { required }) {
  const file = ENV_FILES[target];
  if (!existsSync(file)) {
    if (!required) return null;
    fail(
      `Berkas ${file} tidak ditemukan.\n` +
        `Buat berkas itu di folder proyek dan isi satu baris:\n  ${VARIABLE}=<URL Session pooler proyek ${target}>`,
    );
  }
  let text = readFileSync(file, "utf8");
  // Beberapa editor menyimpan UTF-8 dengan penanda BOM di awal berkas; buang bila ada.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const value = parseEnv(text)[VARIABLE]?.trim();
  if (!value) {
    if (!required) return null;
    fail(`${VARIABLE} belum diisi di ${file}.`);
  }
  return value;
}

function describeUrl(value, target) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(
      `${VARIABLE} di ${ENV_FILES[target]} bukan URL yang valid. Jika password memuat simbol (@ # / : ?), ubah password-nya menjadi huruf dan angka saja.`,
    );
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    fail(`${VARIABLE} harus diawali postgresql:// (ditemukan "${url.protocol}//").`);
  }
  if (!url.hostname || !url.username)
    fail(`${VARIABLE} tidak lengkap: host atau nama pengguna kosong.`);
  if (!url.password) fail(`${VARIABLE} tidak memuat password.`);

  const isLocal = LOCAL_HOSTS.has(url.hostname);
  const port = url.port || "5432";
  if (!isLocal && port === "6543") {
    fail(
      "Migrasi tidak boleh lewat Transaction pooler (port 6543).\n" +
        'Pakai "Session pooler" (port 5432) dari tombol Connect di Supabase.',
    );
  }
  const passwords = [url.password, safeDecode(url.password)].filter(Boolean);
  return {
    url: value,
    host: url.hostname,
    port,
    user: decodeURIComponent(url.username),
    database: url.pathname.replace(/^\//, "") || "postgres",
    // Untuk Supabase, nama pengguna berbentuk "postgres.<kode-proyek>".
    label: decodeURIComponent(url.username).split(".")[1] ?? decodeURIComponent(url.username),
    isLocal,
    passwords,
  };
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Pengaman: URL dev dan prod tidak boleh menunjuk proyek yang sama. */
function assertTargetsDiffer(target, info) {
  const otherTarget = target === "dev" ? "prod" : "dev";
  const otherValue = readUrlFromFile(otherTarget, { required: false });
  if (!otherValue) return;
  let other;
  try {
    other = describeUrl(otherValue, otherTarget);
  } catch {
    return; // URL lawan tak valid: bukan urusan perintah ini.
  }
  if (other.host === info.host && other.user === info.user && other.database === info.database) {
    fail(
      `URL ${target} di ${ENV_FILES[target]} menunjuk proyek yang SAMA dengan ${otherTarget} (${ENV_FILES[otherTarget]}).\n` +
        "Dibatalkan demi keamanan. Periksa kembali URL yang ditempel: dev dan prod harus proyek Supabase yang berbeda.",
    );
  }
}

function connect(info) {
  return postgres(info.url, {
    max: 1,
    prepare: false,
    connect_timeout: 15,
    idle_timeout: 20,
    ssl: info.isLocal ? false : "require",
    onnotice: () => {},
  });
}

/* ------------------------------------------------------------------- tanya */

function ask(question) {
  if (!process.stdin.isTTY) {
    fail(
      "Konfirmasi produksi butuh terminal interaktif (tidak bisa lewat pipe atau skrip otomatis).",
    );
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.once("close", () => resolve(""));
    rl.question(question, (answer) => {
      // Urutan penting: `resolve` dulu, baru `close` (close memicu resolve("") di atas).
      resolve(answer.trim());
      rl.close();
    });
  });
}

/* ----------------------------------------------------------------- migrasi */

function journalCount() {
  const journal = JSON.parse(readFileSync(`${MIGRATIONS_FOLDER}/meta/_journal.json`, "utf8"));
  return journal.entries.length;
}

async function appliedCount(sql) {
  const [{ exists }] =
    await sql`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`;
  if (!exists) return 0;
  const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
  return count;
}

async function runMigrate(sql, info, target) {
  const total = journalCount();
  const before = await appliedCount(sql);
  const pending = total - before;

  if (pending < 0) {
    fail(
      `Database punya ${before} migrasi, tetapi folder drizzle/ hanya ${total}.\n` +
        "Folder migrasi tidak lengkap atau database ini bukan milik proyek ini. Dibatalkan.",
    );
  }
  console.log(
    `Migrasi di folder: ${total} | sudah terpasang: ${before} | akan dipasang: ${pending}`,
  );

  if (pending > 0) {
    if (target === "prod") {
      console.log(
        "\nIni database PRODUKSI. Perubahan langsung berlaku untuk situs yang sebenarnya.",
      );
      const answer = await ask(`Ketik kode proyek "${info.label}" lalu Enter untuk melanjutkan: `);
      if (answer !== info.label) fail("Konfirmasi tidak cocok. Dibatalkan, tidak ada perubahan.");
    }
    try {
      await migrate(drizzle(sql), { migrationsFolder: MIGRATIONS_FOLDER });
    } catch (error) {
      error.migrationFailed = true;
      throw error;
    }
    const after = await appliedCount(sql);
    console.log(`Migrasi selesai. Terpasang sekarang: ${after} dari ${total}.`);
  } else {
    console.log("Tidak ada migrasi baru. Database sudah mutakhir.");
  }

  console.log("\nPemeriksaan hasil:");
  await runVerify(sql);
}

/* --------------------------------------------------------------- pemeriksaan */

const ROLLBACK = Symbol("rollback");

/** Role API yang benar-benar ada di server ini (di Postgres biasa tidak ada). */
async function existingApiRoles(sql) {
  const rows =
    await sql`select rolname from pg_roles where rolname = any(${sql.array(API_ROLES)}) order by rolname`;
  return rows.map((row) => row.rolname);
}

async function collectChecks(sql) {
  const checks = [];
  const add = (name, problems) => checks.push({ name, problems });

  // 1) Semua migrasi di folder sudah terpasang.
  const total = journalCount();
  const applied = await appliedCount(sql);
  add(
    "Semua migrasi terpasang",
    applied === total ? [] : [`terpasang ${applied} dari ${total}; jalankan migrasi dahulu`],
  );

  // 2) RLS aktif di SEMUA tabel public, dan tidak ada kebijakan yang membukanya.
  const noRls = await sql`
    select relname from pg_class
     where relnamespace = 'public'::regnamespace and relkind in ('r', 'p') and not relrowsecurity
     order by relname`;
  add(
    "RLS aktif di semua tabel public",
    noRls.map((row) => `${row.relname} belum memakai RLS`),
  );

  const [{ count: policyCount }] =
    await sql`select count(*)::int as count from pg_policies where schemaname = 'public'`;
  add(
    "Tidak ada kebijakan RLS yang membuka data",
    policyCount === 0 ? [] : [`ditemukan ${policyCount} kebijakan`],
  );

  // 3) Role API Supabase tidak punya hak atas tabel kita (hak efektif, termasuk lewat PUBLIC/warisan).
  const roles = await existingApiRoles(sql);
  if (roles.length === 0) {
    checks.push({
      name: "Role API tanpa hak atas tabel (dilewati: role API tidak ada di server ini)",
      problems: [],
    });
  } else {
    const leaks = await sql`
      select r.rolname as role, c.relname as tbl, p.priv
        from pg_class c
       cross join pg_roles r
       cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) as p(priv)
       where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p')
         and r.rolname = any(${sql.array(roles)})
         and has_table_privilege(r.oid, c.oid, p.priv)
       order by 1, 2, 3`;
    add(
      "Role API (anon, authenticated, service_role) tanpa hak atas tabel",
      leaks.map((row) => `${row.role} masih punya ${row.priv} di ${row.tbl}`),
    );

    // 4) Tabel yang dibuat nanti juga tidak otomatis terbuka. Diuji nyata: buat tabel
    //    percobaan di dalam transaksi, periksa, lalu BATALKAN transaksinya.
    let probeLeaks = [];
    try {
      await sql.begin(async (tx) => {
        await tx`create table public.zz_verify_probe (id int)`;
        probeLeaks = await tx`
          select r.rolname as role
            from pg_roles r
           where r.rolname = any(${tx.array(roles)})
             and has_table_privilege(r.oid, 'public.zz_verify_probe'::regclass, 'SELECT')`;
        throw ROLLBACK;
      });
    } catch (error) {
      if (error !== ROLLBACK) throw error;
    }
    add(
      "Tabel baru tidak otomatis terbuka untuk role API",
      probeLeaks.map((row) => `${row.role} otomatis dapat akses ke tabel baru`),
    );
  }

  // 5) Trigger penjaga aturan bisnis ada semua.
  const triggers = await sql`
    select tgname from pg_trigger
     where not tgisinternal and tgrelid in (select oid from pg_class where relnamespace = 'public'::regnamespace)`;
  const present = new Set(triggers.map((row) => row.tgname));
  add(
    "Trigger penjaga aturan bisnis lengkap",
    REQUIRED_TRIGGERS.filter((name) => !present.has(name)).map((name) => `trigger ${name} hilang`),
  );

  // 6) Fungsi kita aman dari pembajakan search_path.
  const loose = await sql`
    select proname from pg_proc
     where pronamespace = 'public'::regnamespace and prokind = 'f'
       and not coalesce(proconfig, '{}') @> array['search_path=""']
     order by proname`;
  add(
    "Semua fungsi memakai search_path kosong",
    loose.map((row) => `${row.proname} belum diamankan`),
  );

  // 7) Tiga halaman legal tersedia.
  const legal = await sql`select slug from legal_pages`;
  const slugs = new Set(legal.map((row) => row.slug));
  add(
    "Tiga halaman legal tersedia",
    REQUIRED_LEGAL_SLUGS.filter((slug) => !slugs.has(slug)).map((slug) => `halaman ${slug} hilang`),
  );

  return checks;
}

async function runVerify(sql) {
  let checks;
  try {
    checks = await collectChecks(sql);
  } catch (error) {
    if (error?.code === "42P01") {
      fail("Tabel belum ada. Jalankan migrasi terlebih dahulu (pnpm db:migrate).");
    }
    throw error;
  }
  for (const check of checks) {
    if (check.problems.length === 0) {
      console.log(`  [OK]     ${check.name}`);
    } else {
      console.log(`  [GAGAL]  ${check.name}`);
      for (const problem of check.problems) console.log(`             - ${problem}`);
    }
  }
  const failed = checks.filter((check) => check.problems.length > 0).length;
  if (failed > 0) fail(`${failed} pemeriksaan gagal.`);
  console.log("\nSemua pemeriksaan lolos.");
}

/* -------------------------------------------------------------------- galat */

/** Menelusuri rantai `cause` (Drizzle membungkus galat driver) dan menutupi password. */
function describeError(error, passwords) {
  const parts = [];
  let current = error;
  for (let depth = 0; current && depth < 4; depth++, current = current.cause) {
    const code = current.code ? ` [${current.code}]` : "";
    // Pesan "Failed query: <seluruh SQL>" dari Drizzle terlalu panjang dan tidak berguna.
    const message = String(current.message ?? current).startsWith("Failed query:")
      ? "pernyataan SQL gagal dijalankan"
      : String(current.message ?? current);
    parts.push(`${current.name ?? "Error"}${code}: ${message}`);
    if (current.detail) parts.push(`  detail: ${current.detail}`);
    if (current.hint) parts.push(`  petunjuk: ${current.hint}`);
  }
  let text = parts.join("\n");
  for (const password of passwords) text = text.split(password).join("***");
  return text;
}

function hintFor(error, info) {
  const codes = new Set();
  for (let current = error, depth = 0; current && depth < 4; depth++, current = current.cause) {
    if (current.code) codes.add(current.code);
  }
  if (codes.has("28P01"))
    return "Password salah. Salin ulang URL dari Supabase (atau reset password database di Settings > Database).";
  if (codes.has("XX000") || codes.has("28000")) {
    return "Pengguna/proyek tidak dikenali. Pastikan nama pengguna berbentuk postgres.<kode-proyek> dan host-nya dari Session pooler.";
  }
  if (
    ["ENOTFOUND", "ENETUNREACH", "EHOSTUNREACH", "ETIMEDOUT", "CONNECT_TIMEOUT"].some((code) =>
      codes.has(code),
    )
  ) {
    return /^db\..+\.supabase\.co$/.test(info.host)
      ? 'Koneksi langsung (db.*.supabase.co) hanya IPv6 dan sering gagal. Pakai URL "Session pooler" (host *.pooler.supabase.com, port 5432).'
      : "Server tidak terjangkau. Periksa koneksi internet, host, dan port; proyek Supabase Free yang lama tidak dipakai bisa sedang dijeda (Resume di dashboard).";
  }
  return null;
}

/* --------------------------------------------------------------------- main */

function usage() {
  console.error("Pemakaian: node scripts/db.mjs <migrate|verify> <dev|prod>");
  process.exitCode = 1;
}

async function main() {
  const [command, target] = process.argv.slice(2);
  if (!["migrate", "verify"].includes(command) || !Object.hasOwn(ENV_FILES, target)) return usage();

  let info;
  let sql;
  try {
    info = describeUrl(readUrlFromFile(target, { required: true }), target);
    assertTargetsDiffer(target, info);

    console.log(`Target   : ${target}`);
    console.log(
      `Server   : ${info.host}:${info.port}  (database ${info.database}, pengguna ${info.user})`,
    );
    console.log(`Perintah : ${command}\n`);

    sql = connect(info);
    if (command === "migrate") await runMigrate(sql, info, target);
    else await runVerify(sql);
  } catch (error) {
    process.exitCode = 1;
    if (error instanceof UserError) {
      console.error(`\n${error.message}`);
    } else {
      console.error(`\nGagal:\n${describeError(error, info?.passwords ?? [])}`);
      const hint = info ? hintFor(error, info) : null;
      if (hint) console.error(`\nSaran: ${hint}`);
      if (error?.migrationFailed)
        console.error(
          "\nMigrasi berjalan dalam satu transaksi: tidak ada perubahan yang tersimpan.",
        );
    }
  } finally {
    await sql?.end({ timeout: 5 });
  }
}

await main();
