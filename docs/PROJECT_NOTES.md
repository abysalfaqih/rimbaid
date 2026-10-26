# Catatan Proyek — Rimba ID

> Berkas ini adalah memori proyek. Di awal setiap percakapan baru dengan asisten, tempel seluruh isinya.
> Perbarui setiap kali sebuah fase selesai (bagian 8, 12, dan 14 paling sering berubah).

Terakhir diperbarui: 2026-10-26 (Fase 2A selesai dikerjakan; menunggu checkpoint pemilik)

## 1. Ringkasan

Rimba ID adalah situs pribadi, seperti PlayStore/AppStore kecil, untuk membagikan aplikasi buatan sendiri.
Dua bahasa (Indonesia dan Inggris), tampilan modern dan profesional, responsif (ponsel dan desktop),
SEO kuat, aman, dan mudah dirawat jangka panjang. Tidak ada kategori aplikasi. Gerbang verifikasi unduhan tidak dimonetisasi.

## 2. Spesifikasi fitur

- Beranda: bagian "New Update" paling atas berisi satu aplikasi (dipilih di admin; memilih yang baru menghilangkan yang lama). Di bawahnya 6 aplikasi. Jika lebih dari 6, muncul "show more" ke halaman semua aplikasi.
- Detail aplikasi: logo, tombol unduh (maksimal 3, nama dan tautan kustom), deskripsi, informasi aplikasi (ukuran, versi), screenshot (maksimal 8, gaya Play Store), dan 3 rekomendasi aplikasi pilihan admin.
- Verifikasi unduhan 3 langkah: hitung mundur 10 detik, 15 detik, 20 detik. Selama hitung mundur tidak ada tombol; setelah habis muncul "Next"; langkah 2 tidak berjalan sebelum "Next" diklik; langkah terakhir tombolnya "Download". Tidak boleh bisa dilewati, dan tautan asli tidak boleh bisa diambil langsung.
- Halaman Terms of Service, Privacy Policy, dan Disclaimer, semuanya bisa diedit di admin (wajib dua bahasa).
- Admin lengkap: kelola aplikasi, statistik realtime, dan lain-lain.
- Form aplikasi: logo, nama, slug otomatis (tidak bisa diubah), ukuran, versi, deskripsi (ID dan EN), tombol unduh (maksimal 3), screenshot (maksimal 8), pilih 3 rekomendasi, toggle publish/draft.

## 3. Keputusan

- Bahasa situs: Indonesia dan Inggris. Deskripsi aplikasi dan halaman legal WAJIB di kedua bahasa (bukan opsional).
- URL bahasa: Indonesia di `/`, Inggris di `/en`. ASUMSI, belum dikonfirmasi pemilik. Ubah di `src/i18n/routing.ts`.
- Tanpa deteksi bahasa otomatis dan tanpa cookie bahasa. Bahasa ditentukan URL, pengunjung berganti lewat tombol ID/EN. Bisa dibalik dengan satu baris di `routing.ts`.
- Tema: hanya gelap, sesuai identitas logo.
- Hosting: Vercel (plan Hobby, non-komersial). Domain: belum punya, memakai `*.vercel.app`.
- Database: Supabase Postgres dengan Drizzle ORM (Fase 2; versi Drizzle ditentukan saat itu).
- Penyimpanan gambar: Supabase Storage atau Cloudinary (diputuskan di Fase 4).
- Font di-host sendiri (fontsource + `next/font/local`), tanpa Google Fonts.
- Footer memakai tahun tetap (`foundedYear` di `src/lib/site.ts`) karena halaman statis tidak boleh memakai tanggal berjalan.
- CSP tanpa nonce (memakai `'unsafe-inline'` untuk script/style) agar halaman tetap bisa statis; ditinjau ulang di Fase 10.
- Manifest, robots, sitemap, dan JSON-LD ditunda ke Fase 9.
- Domain produksi: `https://rimbaid.vercel.app` (isi domain Anda yang sebenarnya jika berbeda).
- URL bahasa (ID di `/`, EN di `/en`): dianggap disetujui pemilik (tidak ada keberatan setelah 1B).
- Database: dua proyek Supabase Free di Singapura (ap-southeast-1): `rimba-id-dev` (lokal + deploy preview) dan `rimba-id-prod` (situs live). Fungsi Vercel di `sin1` (`vercel.json`).
- Supabase Data API DIMATIKAN di kedua proyek; semua akses lewat server dengan koneksi Postgres langsung. Tinjau ulang bila Fase 8 butuh Realtime dari browser.
- Koneksi aplikasi: Transaction pooler (port 6543), `prepare: false`, `max: 1`, TLS wajib untuk host non-lokal. Migrasi (Fase 2B) lewat Session pooler (port 5432 di host pooler), karena koneksi langsung hanya IPv6.
- ORM: Drizzle 0.45.x (stabil), BUKAN 1.0 RC. Kode ditulis agar mudah naik ke 1.0: tanpa opsi `casing`, tanpa Relational Queries v1, nama kolom snake_case ditulis eksplisit. Tinjau saat 1.0 stabil.

## 4. Stack dan versi terkunci (dicek 2026-10-24)

- Node 24.x (`engines`), pnpm 12.x. Versi pnpm ditulis otomatis ke `packageManager`; jangan diubah manual.
- Next.js 16.4.3 (versi persis), React 19.3.1, TypeScript 5.x.
- Tailwind CSS 4 dengan `@tailwindcss/turbopack`.
- Zod 4.6.x untuk validasi environment.
- ESLint 9.39.x (TETAP 9: ESLint 10 membuat peer dependency eslint-config-next tidak terpenuhi). Prettier 3.9.x + prettier-plugin-tailwindcss.
- next-intl 4.14.x (routing dua bahasa).
- Font: Bricolage Grotesque (judul, varian opsz) dan Plus Jakarta Sans (teks), keduanya dari `@fontsource-variable/*`.
- Next.js 16: `proxy.ts` menggantikan `middleware.ts`; `cacheComponents` dan `partialPrefetching` aktif; Turbopack bawaan.
- pnpm 12: skrip build dependensi diblokir lewat `allowBuilds` di `pnpm-workspace.yaml` (paket baru yang punya skrip build harus dinyatakan di sana, kalau tidak muncul `ERR_PNPM_IGNORED_BUILDS`). `minimumReleaseAge: 1440` menolak paket yang dirilis kurang dari 24 jam.
- drizzle-orm ^0.45.4 dan postgres ^3.4.9 (driver). drizzle-kit ditambahkan di Fase 2B

## 5. Struktur folder

```
rimba-id/
├─ docs/PROJECT_NOTES.md          catatan ini
├─ messages/{id,en}.json          semua teks tampilan (wajib sepadan)
├─ public/og/default.jpg          gambar Open Graph 1200x630
├─ scripts/                       clean.mjs, check-messages.mjs
├─ src/
│  ├─ app/
│  │  ├─ [locale]/                layout, page, not-found, [...rest]
│  │  ├─ api/health/route.ts      cek kesehatan untuk pemantauan
│  │  ├─ globals.css              token desain
│  │  └─ icon.png, apple-icon.png, favicon.ico
│  ├─ assets/brand/               logo-figure.webp, logo-mark.webp
│  ├─ components/{brand,layout}/
│  ├─ i18n/                       routing, navigation, request
│  ├─ lib/                        env/, fonts, seo, site
│  ├─ proxy.ts                    routing bahasa (nanti: proteksi admin)
│  └─ types/next-intl.d.ts        tipe aman untuk terjemahan
├─ next.config.ts                 header keamanan + plugin next-intl
├─ pnpm-workspace.yaml            pengaturan pnpm (allowBuilds, minimumReleaseAge)
└─ .env.example                   contoh environment (tanpa rahasia)
tambahkan ke struktur folder: src/db/ (client.ts = koneksi, health.ts = pengecekan) dan vercel.json (region + cron).
```

## 6. Environment variables

- `NEXT_PUBLIC_SITE_URL`: URL situs tanpa slash di akhir. Lokal `http://localhost:3000`; produksi URL asli (https). Divalidasi Zod saat build; salah format = build gagal. Nilainya ditanam saat build, jadi mengubahnya di Vercel WAJIB Redeploy.
- Nilai rahasia (kunci API, password) TIDAK pernah ditempel di chat. Hanya nama variabelnya.
- `.env.local` tidak boleh di-commit; hanya `.env.example`.
- tambahkan: DATABASE_URL: URL Transaction pooler (rahasia). Lokal = proyek dev; Vercel Production = proyek prod; Vercel Preview = proyek dev. Di Vercel wajib port 6543 (divalidasi). Mengubah nilai di Vercel butuh deploy ulang.

## 7. Perintah harian

- `pnpm dev`: server pengembangan. `pnpm build` lalu `pnpm start`: uji mode produksi.
- `pnpm check`: semua pemeriksaan (paritas terjemahan, tipe, lint, format). Jalankan sebelum commit.
- `pnpm format`: rapikan kode. `pnpm clean`: hapus `.next` (pakai jika tipe rute lama membuat `tsc` error).

## 8. Peta jalan dan progres

- [x] Fase 0: persiapan
- [x] Fase 1A: fondasi (scaffold, tooling, header keamanan, validasi env)
- [x] Fase 1B: bahasa, sistem desain, logo, kerangka halaman, deploy pertama (lolos di komputer dan Vercel pemilik)
- [ ] Fase 2: database.
  [x] 2A koneksi + health check (menunggu checkpoint) ·
  [ ] 2B skema + migrasi + RLS
- [ ] Fase 3: login admin + MFA
- [ ] Fase 4: CRUD admin + unggah gambar
- [ ] Fase 5: halaman publik (beranda, daftar, detail)
- [ ] Fase 6: verifikasi unduhan yang ditegakkan server
- [ ] Fase 7: halaman legal yang bisa diedit
- [ ] Fase 8: statistik realtime (tanpa menyimpan IP mentah)
- [ ] Fase 9: SEO (sitemap, robots, manifest, JSON-LD)
- [ ] Fase 10: pengerasan, backup, dokumen perawatan

Aturan: fase berikutnya dimulai hanya setelah pengecekan fase sebelumnya lolos di komputer pemilik.

## 9. Sistem desain

- Token ada di `src/app/globals.css` (`@theme`): permukaan canvas/surface/raised/overlay, teks fg/fg-muted/fg-faint, aksen gold/flame/ruby.
- Warna diukur dari logo: oranye #ED7006, emas #D9AD47, kuning terang #FAEE6D, hitam #0B0B0B–#131312, krem #F9F6ED, rubi #CD3922.
- Semua pasangan teks/latar lolos WCAG AA (terendah: fg-faint di atas raised, 4.69:1). Jangan menambah pasangan warna tanpa menghitung kontrasnya.
- Utilitas: `container-page` (lebar dan gutter), `hero-glow`, `fade-bottom`.
- Fokus keyboard selalu terlihat (outline emas); animasi dimatikan untuk pengguna `prefers-reduced-motion`.
- Ikon/favicon memakai ubin gelap #020203 (warna kerudung pada logo) agar sambungan mahkota tak terlihat.

## 10. Keamanan (status)

- Header di `next.config.ts`: CSP, HSTS (max-age 2 tahun; tanpa includeSubDomains/preload sampai domain final), nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy, COOP same-origin; `X-Powered-By` dimatikan.
- Deploy preview Vercel mendapat `X-Robots-Tag: noindex, nofollow`.
- Situs publik bebas cookie.
- Rencana verifikasi unduhan: token acak (hanya hash yang disimpan), jam server yang menentukan (timer di layar hanya tampilan), urutan langkah ditegakkan server, tautan asli di tabel terpisah yang tak bisa dibaca publik, sekali pakai dan kedaluwarsa singkat, pembatasan laju, halaman verifikasi `noindex`.

## 11. SEO (status)

- Setiap halaman memakai `buildPageMetadata` (`src/lib/seo.ts`): canonical, hreflang id/en/x-default, Open Graph, Twitter Card.
- Canonical/hreflang sengaja TIDAK di layout (akan diwariskan salah ke semua halaman).
- Belum ada: sitemap, robots, manifest, data terstruktur (Fase 9).

## 12. Batas dan risiko yang diketahui

- Setelah langkah verifikasi ke-3, tautan unduhan bisa dibagikan pengguna. Itu batas semua gerbang semacam ini; yang kita cegah adalah mengambil tautan tanpa melewati langkah.
- Halaman 404 tanpa JavaScript tampil kosong (status tetap 404 dan ada `noindex`, jadi aman untuk SEO). Dengan JavaScript tampil normal. Satu percobaan perbaikan membuat statusnya salah (200), jadi dibatalkan. Ditinjau ulang di Fase 10 pada Vercel nyata.
- CSP memakai `'unsafe-inline'` (lihat keputusan di atas).
- Vercel Hobby: non-komersial; cron hanya sekali sehari.
- Supabase paket gratis: proyek dijeda setelah 7 hari tanpa aktivitas, tidak ada backup harian, kuota penyimpanan dan transfer terbatas (cek ulang halaman resmi saat Fase 2).
- Logo sumber beresolusi rendah (1800 px, hasil diperbesar); versi vektor akan menghasilkan ikon dan gambar OG yang lebih tajam.
- Skor Lighthouse belum diukur.
- Pengujian asisten dilakukan di Linux dengan Node 22 (Postgres 16 asli untuk database); Node 24, Windows, Supabase, dan Vercel diuji pemilik
- Supabase Free menjeda proyek yang aktivitasnya rendah selama 7 hari. Cron harian ke `/api/health` hanyalah mitigasi (belum terbukti dihitung sebagai aktivitas). Proyek prod yang dijeda = situs tidak bisa membaca data; pulihkan lewat dashboard.
- ESLint 9.39.5 tidak lagi didukung; ESLint 10 belum didukung plugin eslint-config-next (import, jsx-a11y, react). Cek ulang tiap fase. Hanya alat dev.
- TLS database: `require` (terenkripsi, tanpa verifikasi sertifikat); penguatan di Fase 10.

## 13. Aturan kerja

- Instruksi dan kode lengkap ditulis di chat; pemilik mengikuti persis.
- Galat dikirim lengkap beserta berkas terkait.
- Rahasia tidak pernah ditempel di chat.
- Fase baru hanya setelah pengecekan fase lama lolos.
- Perbarui berkas ini di setiap akhir fase.

## 14. Changelog

- 2026-10-26, Fase 2A: koneksi Supabase (Drizzle + postgres.js, transaction pooler, TLS), validasi `DATABASE_URL`, `/api/health` memeriksa database (503 jika gagal), region fungsi `sin1`, cron harian keep-alive.
- 2026-10-25, perbaikan 1B: `[locale]/[...rest]/page.tsx` diberi `export const instant = false` (menghilangkan galat palsu validasi instan di mode dev; produksi tidak terpengaruh).
- 2026-10-25, Fase 1B: next-intl (ID di `/`, EN di `/en`), sistem desain gelap, font self-host, logo/ikon/OG, header+footer, beranda sementara, 404 berbahasa, SEO per halaman, skrip `i18n:check` dan `clean`, `AGENTS.md` diabaikan Prettier.
- 2026-10-24, Fase 1A: scaffold Next.js 16 + tooling, header keamanan, validasi environment, endpoint `/api/health`.
- Fase 0: persiapan lingkungan.
