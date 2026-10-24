# Rimba ID — Catatan Proyek

> Dokumen hidup. Perbarui di akhir setiap fase.
> Jika membuka percakapan baru dengan Claude, tempel seluruh isi file ini.

## 1. Ringkasan

Website pribadi untuk membagikan aplikasi buatan sendiri (etalase mirip Play Store).
Satu kategori saja (tidak ada field/tabel kategori).
Unduhan wajib melewati verifikasi 3 langkah (10/15/20 detik) yang ditegakkan di server.
Gerbang verifikasi TIDAK dimonetisasi.

## 2. Keputusan (log)

| Tanggal    | Keputusan                                                                                               | Alasan                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 2026-10-24 | Bahasa: Indonesia + Inggris (next-intl). Deskripsi aplikasi dan halaman legal WAJIB ada di kedua bahasa | Permintaan pemilik                                                                      |
| 2026-10-24 | Screenshot maks. 8 per aplikasi                                                                         | Seperti Play Store                                                                      |
| 2026-10-24 | pnpm saja, Node 24.x                                                                                    | Sudah terpasang; sama dengan default Vercel                                             |
| 2026-10-24 | Palet dari logo (hitam, emas, oranye, merah rubi)                                                       | Konsistensi brand                                                                       |
| 2026-10-24 | Hosting Vercel Hobby (cukup selama non-komersial). Tinjau ulang jika kelak ada iklan/donasi/afiliasi    | Aturan fair use Vercel                                                                  |
| 2026-10-24 | Domain belum ada; sementara memakai *.vercel.app                                                        | Pemilik belum punya domain                                                              |
| 2026-10-24 | Next.js dikunci versi pasti; naik manual tiap bulan via `pnpm next upgrade`                             | Tambalan keamanan rutin                                                                 |
| 2026-10-24 | ESLint tetap 9.x                                                                                        | ESLint 10 belum cocok dengan peer dependency plugin bawaan Next                         |
| 2026-10-24 | pnpm minimumReleaseAge 24 jam (kecuali paket Next); skrip build paket diblokir per paket (allowBuilds)  | Pertahanan rantai pasok                                                                 |
| 2026-10-24 | Env divalidasi Zod saat build; env server dipisah dan ditandai server-only                              | Konfigurasi salah ketahuan sebelum deploy; rahasia tak bisa bocor ke browser            |
| 2026-10-24 | CSP tanpa nonce ('unsafe-inline' untuk skrip)                                                           | Nonce memaksa semua halaman dinamis dan tak cocok dengan PPR; ditinjau ulang di Fase 10 |
| TUNDA      | ORM Drizzle: versi 0.x atau 1.0 ditentukan di Fase 2                                                    | Sumber bertentangan                                                                     |
| TUNDA      | Skema URL bahasa (usulan: ID di `/`, EN di `/en`)                                                       | Dikonfirmasi di Fase 1B                                                                 |

## 3. Stack & versi (dikunci 2026-10-24)

Next.js 16.4.3 (App Router, Turbopack, Cache Components) · React 19.3.1 · TypeScript 5.9 strict
Tailwind CSS 4.3.3 · Zod 4.6.7 · ESLint 9.39 · Prettier 3.9 · pnpm 12.x · Node 24.x

## 4. Struktur folder

- `src/app/` rute (layout, page, api)
- `src/lib/env/` validasi environment (public.ts, server.ts)
- `src/lib/site.ts` konfigurasi situs
- `docs/` dokumen proyek
- `.vscode/` pengaturan editor bersama

## 5. Environment variables (nama saja)

- `NEXT_PUBLIC_SITE_URL` — URL situs tanpa slash akhir (wajib https kecuali localhost)

## 6. Batasan layanan yang diketahui (dicek 2026-10-24)

- Vercel Hobby: non-komersial; cron hanya sekali sehari.
- Supabase gratis: pause setelah 7 hari tanpa aktivitas, tanpa backup harian,
  storage ±1 GB, egress ±5 GB/bulan (cek halaman resmi saat membuat project).

## 7. Risiko & mitigasi

- Project Supabase ter-pause -> keep-alive harian + backup sendiri (Fase 10)
- Pengambilalihan akun -> 2FA authenticator di semua layanan
- Celah keamanan Next.js -> versi dikunci, pembaruan bulanan
- Link unduhan bocor -> verifikasi di server; link asli tak pernah ada di HTML/JS publik

## 8. Aturan kerja

- Nilai rahasia tidak pernah ditempel di chat; hanya nama variabelnya.
- Error dikirim lengkap beserta file terkait.
- Fase berikutnya dimulai hanya setelah pengecekan fase sebelumnya lolos.

## 9. Progres

- [x] Fase 0 - [x] Fase 1A - [ ] Fase 1B (i18n, design system, logo, deploy pertama)
- [ ] Fase 2 - [ ] Fase 3 - [ ] Fase 4 - [ ] Fase 5 - [ ] Fase 6
- [ ] Fase 7 - [ ] Fase 8 - [ ] Fase 9 - [ ] Fase 10

## 10. Warna terukur dari logo

Oranye #ED7006 · Emas #D9AD47 · Kuning terang #FAEE6D · Hitam #0B0B0B–#131312 · Krem #F9F6ED
Merah rubi: belum diukur (Fase 1B). Logo asli 1800x1800 PNG transparan, 3,3 MB (perlu optimasi).

## 11. Masalah / TODO terbuka

- Domain belum ada.
- Konfirmasi skema URL bahasa.

## 12. Changelog

- 2026-10-24: Proyek dimulai, keputusan awal dicatat.
- 2026-10-24: Fase 1A selesai: proyek Next.js, tooling, header keamanan, validasi env, endpoint health.
