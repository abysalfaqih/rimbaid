// Uji aturan database. Menjalankan SEMUA migrasi di folder `drizzle/` pada Postgres sungguhan
// yang berjalan di memori (PGlite), lalu mencoba melanggar setiap aturan bisnis.
// Tidak butuh internet, Supabase, ataupun instalasi Postgres. Jalankan: `pnpm db:test`.
//
// Role Supabase (anon, authenticated, service_role) ditiru lebih dulu, lengkap dengan hak bawaan
// versi lama (paling longgar), supaya terbukti migrasi benar-benar mencabutnya.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const API_ROLES = ["anon", "authenticated", "service_role"];
const APP_TABLES = [
  "apps",
  "app_screenshots",
  "app_downloads",
  "app_recommendations",
  "legal_pages",
];

/** @type {PGlite} */
let pg;
let counter = 0;

const query = (text, params = []) => pg.query(text, params);

/** Pernyataan harus GAGAL, dan pesan galatnya cocok dengan `pattern`. */
async function rejects(text, params, pattern) {
  await assert.rejects(
    () => pg.query(text, params),
    (error) => {
      assert.match(String(error.message), pattern, `pesan galat tak sesuai untuk: ${text}`);
      return true;
    },
  );
}

/** Membuat aplikasi draft dan mengembalikan id-nya. */
async function createDraft(overrides = {}) {
  const slug = overrides.slug ?? `app-${++counter}`;
  const { rows } = await query("insert into apps (slug, name) values ($1, $2) returning id", [
    slug,
    overrides.name ?? "Aplikasi Uji",
  ]);
  return rows[0].id;
}

/** Membuat aplikasi yang sudah lengkap dan tayang. */
async function createPublished(overrides = {}) {
  const slug = overrides.slug ?? `app-${++counter}`;
  const { rows } = await query(
    `insert into apps (slug, name, logo_path, size_label, version, description_id, description_en, status, is_featured)
     values ($1, 'Aplikasi Tayang', 'logos/x.webp', '24 MB', '1.0.0', 'Deskripsi', 'Description', 'published', $2)
     returning id`,
    [slug, overrides.featured ?? false],
  );
  return rows[0].id;
}

const featuredSlugs = async () =>
  (await query("select slug from apps where is_featured order by slug")).rows.map(
    (row) => row.slug,
  );

before(async () => {
  pg = new PGlite();
  // Tiru proyek Supabase lama: role API ada dan mendapat hak penuh atas tabel baru.
  await pg.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  `);
  await migrate(drizzle(pg), { migrationsFolder: "./drizzle" });
});

after(async () => {
  await pg.close();
});

beforeEach(async () => {
  await pg.exec("truncate table apps cascade");
});

describe("apps: identitas", () => {
  it("menerima slug yang valid", async () => {
    for (const slug of ["a", "abc-123", "x-y-z", "a".repeat(80)]) {
      await createDraft({ slug });
    }
  });

  it("menolak slug yang tidak valid", async () => {
    const invalid = ["", "Bad Slug", "UPPER", "a--b", "-a", "a-", "a_b", "a/b", "a".repeat(81)];
    for (const slug of invalid) {
      await rejects("insert into apps (slug, name) values ($1, 'X')", [slug], /apps_slug_format/);
    }
  });

  it("menolak slug kembar", async () => {
    await createDraft({ slug: "sama" });
    await rejects("insert into apps (slug, name) values ('sama', 'X')", [], /apps_slug_key/);
  });

  it("slug tidak bisa diubah setelah dibuat", async () => {
    const id = await createDraft({ slug: "tetap" });
    await rejects(
      "update apps set slug = 'berubah' where id = $1",
      [id],
      /apps\.slug tidak boleh diubah/,
    );
    // mengisi slug yang sama (tanpa perubahan) tetap diperbolehkan
    await query("update apps set slug = 'tetap' where id = $1", [id]);
  });

  it("menolak nama kosong atau terlalu panjang", async () => {
    for (const name of ["", "   ", "x".repeat(81)]) {
      await rejects("insert into apps (slug, name) values ('n', $1)", [name], /apps_name_length/);
    }
  });

  it("menolak status di luar draft/published", async () => {
    // Datanya dibuat lengkap supaya hanya aturan status yang dilanggar.
    await rejects(
      `insert into apps (slug, name, logo_path, size_label, version, description_id, description_en, status, published_at)
       values ('s', 'X', 'l', '1 MB', '1', 'a', 'b', 'archived', now())`,
      [],
      /apps_status_valid/,
    );
  });
});

describe("apps: tayang harus lengkap", () => {
  it("menolak aplikasi tayang yang datanya belum lengkap", async () => {
    const id = await createDraft();
    await rejects(
      "update apps set status = 'published' where id = $1",
      [id],
      /apps_published_complete/,
    );
    // sebagian terisi pun tetap ditolak
    await rejects(
      "update apps set status = 'published', logo_path = 'l', size_label = '1 MB', version = '1' where id = $1",
      [id],
      /apps_published_complete/,
    );
  });

  it("menolak deskripsi yang hanya berisi spasi di salah satu bahasa", async () => {
    const id = await createDraft();
    await rejects(
      `update apps set status = 'published', logo_path = 'l', size_label = '1 MB', version = '1',
         description_id = 'ada', description_en = '   ' where id = $1`,
      [id],
      /apps_published_complete/,
    );
  });

  it("menerima aplikasi lengkap dan mengisi published_at otomatis", async () => {
    const id = await createPublished();
    const { rows } = await query("select published_at from apps where id = $1", [id]);
    assert.ok(rows[0].published_at, "published_at harus terisi otomatis");
  });

  it("published_at tidak berubah saat dipublikasikan ulang", async () => {
    const id = await createPublished();
    const first = (await query("select published_at from apps where id = $1", [id])).rows[0]
      .published_at;
    await query("update apps set status = 'draft' where id = $1", [id]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    await query("update apps set status = 'published' where id = $1", [id]);
    const again = (await query("select published_at from apps where id = $1", [id])).rows[0]
      .published_at;
    assert.equal(again.getTime(), first.getTime());
  });

  it("menolak batas panjang kolom info dan deskripsi", async () => {
    await rejects(
      "insert into apps (slug, name, size_label) values ('a1', 'X', $1)",
      ["x".repeat(21)],
      /apps_size_label_length/,
    );
    await rejects(
      "insert into apps (slug, name, version) values ('a2', 'X', $1)",
      ["x".repeat(31)],
      /apps_version_length/,
    );
    await rejects(
      "insert into apps (slug, name, description_en) values ('a3', 'X', $1)",
      ["x".repeat(5001)],
      /apps_description_length/,
    );
  });
});

describe("apps: New Update (hanya satu)", () => {
  it("menolak New Update pada aplikasi yang belum tayang", async () => {
    await rejects(
      "insert into apps (slug, name, is_featured) values ('f', 'X', true)",
      [],
      /apps_featured_requires_published/,
    );
  });

  it("memilih yang baru otomatis menurunkan yang lama", async () => {
    const a = await createPublished({ slug: "aaa", featured: true });
    const b = await createPublished({ slug: "bbb" });
    assert.deepEqual(await featuredSlugs(), ["aaa"]);

    await query("update apps set is_featured = true where id = $1", [b]);
    assert.deepEqual(await featuredSlugs(), ["bbb"]);

    await query("update apps set is_featured = true where id = $1", [a]);
    assert.deepEqual(await featuredSlugs(), ["aaa"]);
  });

  it("memasukkan aplikasi baru sebagai New Update juga menurunkan yang lama", async () => {
    await createPublished({ slug: "lama", featured: true });
    await createPublished({ slug: "baru", featured: true });
    assert.deepEqual(await featuredSlugs(), ["baru"]);
  });

  it("gagal memilih yang baru TIDAK menurunkan yang lama (atomik)", async () => {
    await createPublished({ slug: "lama", featured: true });
    const draft = await createDraft({ slug: "draf" });
    await rejects(
      "update apps set is_featured = true where id = $1",
      [draft],
      /apps_featured_requires_published/,
    );
    assert.deepEqual(await featuredSlugs(), ["lama"]);
  });

  it("menurunkan ke draft harus sekaligus mencabut New Update", async () => {
    const id = await createPublished({ featured: true });
    await rejects(
      "update apps set status = 'draft' where id = $1",
      [id],
      /apps_featured_requires_published/,
    );
    await query("update apps set status = 'draft', is_featured = false where id = $1", [id]);
  });

  it("indeks unik tetap menjaga jika trigger dimatikan (jaring pengaman)", async () => {
    await createPublished({ slug: "satu", featured: true });
    await pg.exec("alter table apps disable trigger apps_featured_exclusive");
    try {
      await rejects(
        `insert into apps (slug, name, logo_path, size_label, version, description_id, description_en, status, is_featured)
         values ('dua', 'X', 'l', '1 MB', '1', 'a', 'b', 'published', true)`,
        [],
        /apps_single_featured_idx/,
      );
    } finally {
      await pg.exec("alter table apps enable trigger apps_featured_exclusive");
    }
  });
});

describe("apps: updated_at otomatis", () => {
  it("berubah saat isi berubah, tetap saat tidak ada perubahan", async () => {
    const id = await createDraft();
    const read = async () =>
      (await query("select updated_at from apps where id = $1", [id])).rows[0].updated_at.getTime();
    const before = await read();

    await new Promise((resolve) => setTimeout(resolve, 20));
    await query("update apps set name = name where id = $1", [id]);
    assert.equal(await read(), before, "update tanpa perubahan tidak boleh mengubah updated_at");

    await query("update apps set name = 'Nama Baru' where id = $1", [id]);
    assert.ok((await read()) > before, "updated_at harus maju saat isi berubah");
  });
});

describe("app_screenshots: maksimal 8", () => {
  it("menerima posisi 0 sampai 7, menolak yang ke-9 dan duplikat", async () => {
    const app = await createDraft();
    for (let position = 0; position < 8; position++) {
      await query(
        "insert into app_screenshots (app_id, position, path, width, height) values ($1, $2, $3, 1080, 1920)",
        [app, position, `shots/${position}.webp`],
      );
    }
    await rejects(
      "insert into app_screenshots (app_id, position, path, width, height) values ($1, 8, 'x', 1, 1)",
      [app],
      /app_screenshots_position_range/,
    );
    await rejects(
      "insert into app_screenshots (app_id, position, path, width, height) values ($1, 3, 'x', 1, 1)",
      [app],
      /app_screenshots_app_position_key/,
    );
    const { rows } = await query(
      "select count(*)::int as n from app_screenshots where app_id = $1",
      [app],
    );
    assert.equal(rows[0].n, 8);
  });

  it("menolak posisi negatif, ukuran tidak valid, dan path kosong", async () => {
    const app = await createDraft();
    const insert =
      "insert into app_screenshots (app_id, position, path, width, height) values ($1, $2, $3, $4, $5)";
    await rejects(insert, [app, -1, "x", 1, 1], /app_screenshots_position_range/);
    await rejects(insert, [app, 0, "x", 0, 1], /app_screenshots_dimensions/);
    await rejects(insert, [app, 0, "x", 1, 10001], /app_screenshots_dimensions/);
    await rejects(insert, [app, 0, "", 1, 1], /app_screenshots_path_length/);
  });

  it("ikut terhapus saat aplikasinya dihapus", async () => {
    const app = await createDraft();
    await query(
      "insert into app_screenshots (app_id, position, path, width, height) values ($1, 0, 'x', 1, 1)",
      [app],
    );
    await query("delete from apps where id = $1", [app]);
    assert.equal((await query("select count(*)::int as n from app_screenshots")).rows[0].n, 0);
  });
});

describe("app_downloads: maksimal 3, hanya https", () => {
  const insert = "insert into app_downloads (app_id, position, label, url) values ($1, $2, $3, $4)";

  it("menerima posisi 0 sampai 2, menolak yang ke-4 dan duplikat", async () => {
    const app = await createDraft();
    for (let position = 0; position < 3; position++) {
      await query(insert, [
        app,
        position,
        `Tombol ${position}`,
        `https://contoh.com/file-${position}`,
      ]);
    }
    await rejects(
      insert,
      [app, 3, "Tombol", "https://contoh.com/x"],
      /app_downloads_position_range/,
    );
    await rejects(
      insert,
      [app, 1, "Tombol", "https://contoh.com/x"],
      /app_downloads_app_position_key/,
    );
  });

  it("menolak label kosong atau terlalu panjang", async () => {
    const app = await createDraft();
    await rejects(insert, [app, 0, "  ", "https://contoh.com/x"], /app_downloads_label_length/);
    await rejects(
      insert,
      [app, 0, "x".repeat(41), "https://contoh.com/x"],
      /app_downloads_label_length/,
    );
  });

  it("menolak tautan selain https yang rapi", async () => {
    const app = await createDraft();
    const invalid = [
      "http://contoh.com/x",
      "javascript:alert(1)",
      "data:text/html,<script>1</script>",
      "ftp://contoh.com/x",
      "https://",
      "https://contoh .com/x",
      "https://contoh.com/\nx",
      "//contoh.com/x",
      `https://contoh.com/${"x".repeat(2048)}`,
    ];
    for (const url of invalid) {
      await rejects(insert, [app, 0, "Unduh", url], /app_downloads_url_format/);
    }
  });

  it("diberi catatan PRIVAT di dalam database", async () => {
    const { rows } = await query(
      "select obj_description('public.app_downloads'::regclass) as note",
    );
    assert.match(rows[0].note, /PRIVAT/);
  });
});

describe("app_recommendations: maksimal 3", () => {
  const insert =
    "insert into app_recommendations (app_id, recommended_app_id, position) values ($1, $2, $3)";

  it("menerima 3 rekomendasi, menolak yang ke-4", async () => {
    const app = await createDraft();
    const others = [
      await createDraft(),
      await createDraft(),
      await createDraft(),
      await createDraft(),
    ];
    for (let position = 0; position < 3; position++)
      await query(insert, [app, others[position], position]);
    await rejects(insert, [app, others[3], 3], /app_recommendations_position_range/);
    await rejects(insert, [app, others[3], 0], /app_recommendations_pkey/);
  });

  it("menolak merekomendasikan diri sendiri dan pasangan kembar", async () => {
    const app = await createDraft();
    const other = await createDraft();
    await rejects(insert, [app, app, 0], /app_recommendations_not_self/);
    await query(insert, [app, other, 0]);
    await rejects(insert, [app, other, 1], /app_recommendations_pair_key/);
  });

  it("terhapus saat aplikasi sumber maupun aplikasi tujuan dihapus", async () => {
    const a = await createDraft();
    const b = await createDraft();
    const c = await createDraft();
    await query(insert, [a, b, 0]);
    await query(insert, [c, b, 0]);
    await query("delete from apps where id = $1", [b]);
    assert.equal((await query("select count(*)::int as n from app_recommendations")).rows[0].n, 0);
  });
});

describe("legal_pages: tiga halaman tetap", () => {
  it("tersedia dalam dua bahasa sejak awal", async () => {
    const { rows } = await query("select * from legal_pages order by slug");
    assert.deepEqual(
      rows.map((row) => row.slug),
      ["disclaimer", "privacy", "terms"],
    );
    for (const row of rows) {
      for (const column of ["title_id", "title_en", "body_id", "body_en"]) {
        assert.ok(row[column].trim().length > 0, `${row.slug}.${column} tidak boleh kosong`);
      }
    }
  });

  it("menolak halaman di luar tiga yang ditentukan", async () => {
    await rejects(
      "insert into legal_pages (slug, title_id, title_en, body_id, body_en) values ('cookies', 'a', 'b', 'c', 'd')",
      [],
      /legal_pages_slug_valid/,
    );
  });

  it("menolak judul atau isi kosong di salah satu bahasa", async () => {
    await rejects(
      "update legal_pages set body_en = '   ' where slug = 'terms'",
      [],
      /legal_pages_body_length/,
    );
    await rejects(
      "update legal_pages set title_id = '' where slug = 'terms'",
      [],
      /legal_pages_title_length/,
    );
  });

  it("updated_at otomatis saat diedit", async () => {
    const read = async () =>
      (
        await query("select updated_at from legal_pages where slug = 'terms'")
      ).rows[0].updated_at.getTime();
    const before = await read();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await query("update legal_pages set body_id = 'Isi baru' where slug = 'terms'");
    assert.ok((await read()) > before);
    await query(
      "update legal_pages set body_id = 'Dokumen ini sedang disiapkan.' where slug = 'terms'",
    );
  });
});

describe("keamanan", () => {
  it("RLS aktif di semua tabel dan tidak ada kebijakan yang membukanya", async () => {
    const { rows } = await query(
      "select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' order by relname",
    );
    assert.deepEqual(
      rows.map((row) => row.relname),
      [...APP_TABLES].sort(),
    );
    for (const row of rows)
      assert.equal(row.relrowsecurity, true, `RLS belum aktif di ${row.relname}`);

    const policies = await query(
      "select count(*)::int as n from pg_policies where schemaname = 'public'",
    );
    assert.equal(policies.rows[0].n, 0);
  });

  it("role API Supabase tidak punya hak apa pun atas tabel kita", async () => {
    for (const role of API_ROLES) {
      for (const table of APP_TABLES) {
        for (const privilege of [
          "SELECT",
          "INSERT",
          "UPDATE",
          "DELETE",
          "TRUNCATE",
          "REFERENCES",
          "TRIGGER",
        ]) {
          const { rows } = await query("select has_table_privilege($1, $2, $3) as allowed", [
            role,
            `public.${table}`,
            privilege,
          ]);
          assert.equal(rows[0].allowed, false, `${role} masih punya ${privilege} di ${table}`);
        }
      }
    }
  });

  it("tabel yang dibuat di masa depan juga tidak otomatis terbuka untuk role API", async () => {
    await pg.exec("create table public.tabel_uji_masa_depan (id int)");
    try {
      for (const role of API_ROLES) {
        const { rows } = await query(
          "select has_table_privilege($1, 'public.tabel_uji_masa_depan', 'SELECT') as allowed",
          [role],
        );
        assert.equal(rows[0].allowed, false, `${role} otomatis dapat akses ke tabel baru`);
      }
    } finally {
      await pg.exec("drop table public.tabel_uji_masa_depan");
    }
  });

  it("RLS tetap menyembunyikan baris walau hak SELECT sengaja diberikan (lapis kedua)", async () => {
    await createPublished({ slug: "terlihat-tidak" });
    await pg.exec("grant select on apps, legal_pages to anon");
    try {
      await pg.exec("set role anon");
      const apps = await query("select count(*)::int as n from apps");
      const legal = await query("select count(*)::int as n from legal_pages");
      assert.equal(apps.rows[0].n, 0, "anon tidak boleh melihat baris apps");
      assert.equal(legal.rows[0].n, 0, "anon tidak boleh melihat baris legal_pages");
    } finally {
      await pg.exec("reset role");
      await pg.exec("revoke select on apps, legal_pages from anon");
    }
  });

  it("anon tidak bisa membaca tautan unduhan", async () => {
    await pg.exec("set role anon");
    try {
      await rejects("select url from app_downloads", [], /permission denied/);
    } finally {
      await pg.exec("reset role");
    }
  });

  it("semua fungsi buatan kita memakai search_path kosong", async () => {
    const { rows } = await query(
      `select p.proname, p.proconfig
         from pg_proc p
        where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
        order by p.proname`,
    );
    assert.deepEqual(
      rows.map((row) => row.proname),
      [
        "apps_demote_other_featured",
        "apps_prevent_slug_change",
        "apps_set_published_at",
        "set_updated_at",
      ],
    );
    for (const row of rows) {
      assert.ok(
        (row.proconfig ?? []).includes('search_path=""'),
        `${row.proname} belum memakai search_path kosong`,
      );
    }
  });
});
