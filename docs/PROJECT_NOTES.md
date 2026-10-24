# Rimba ID — Catatan Proyek

> Dokumen hidup. Perbarui di akhir setiap fase.
> Jika membuka percakapan baru dengan Claude, tempel seluruh isi file ini.

## 1. Ringkasan
Website pribadi untuk membagikan aplikasi buatan sendiri (etalase mirip Play Store).
Satu kategori saja (tidak ada field/tabel kategori).
Unduhan wajib melewati verifikasi 3 langkah yang ditegakkan di server.

## 2. Keputusan (log)
| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-10-24 | Bahasa: Indonesia + Inggris (next-intl) | Permintaan pemilik; mahal jika ditambah belakangan |
| 2026-10-24 | Screenshot maks. 8 per aplikasi | Seperti Play Store |
| 2026-10-24 | Deskripsi & halaman legal punya versi ID/EN; EN opsional, fallback ke ID (menunggu konfirmasi) | Konsekuensi dua bahasa |
| 2026-10-24 | pnpm saja, Node 24.x | Sudah terpasang; sama dengan default Vercel |
| 2026-10-24 | Palet dari logo: hitam, emas, oranye, merah rubi | Konsistensi brand |
| 2026-10-24 | Stack: Next.js (App Router) + TypeScript strict + Tailwind 4 + Supabase + Zod | Lihat rencana awal |
| TUNDA | ORM Drizzle: versi (0.x vs 1.0) ditentukan di Fase 2 | Sumber bertentangan |
| TUNDA | Paket Vercel: Hobby vs Pro | Tergantung monetisasi |

## 3. Branding
Palet awal (perkiraan dari logo, nilai eksak diambil di Fase 1):
- Tinta: #0D0D0F · Permukaan: #17171A
- Emas: #F5B301 · Oranye: #F27A0C · Rubi: #D62839
- Putih tulang: #F6F1E7

## 4. Batasan layanan yang diketahui (dicek 2026-10-24)
- Vercel Hobby: non-komersial. Iklan/afiliasi = wajib Pro.
- Vercel Hobby cron: sekali per hari.
- Supabase gratis: pause setelah 7 hari tanpa aktivitas, tanpa backup harian,
  storage ±1 GB, egress ±5 GB/bulan (cek halaman resmi saat membuat project).

## 5. Risiko & mitigasi
- Project Supabase ter-pause -> keep-alive harian + backup sendiri (Fase 10)
- Pengambilalihan akun -> 2FA authenticator di semua layanan
- Celah keamanan Next.js -> versi dikunci, pembaruan bulanan
- Link unduhan bocor -> verifikasi di server, link asli tidak pernah ada di HTML/JS publik

## 6. Aturan kerja
- Nilai rahasia (API key, password) tidak pernah ditempel di chat; hanya nama variabel.
- Error dikirim lengkap beserta file terkait.
- Fase berikutnya dimulai hanya setelah pengecekan fase sebelumnya lolos.

## 7. Progres
- [ ] Fase 0  - [ ] Fase 1  - [ ] Fase 2  - [ ] Fase 3  - [ ] Fase 4
- [ ] Fase 5  - [ ] Fase 6  - [ ] Fase 7  - [ ] Fase 8  - [ ] Fase 9  - [ ] Fase 10

## 8. Masalah / TODO terbuka
- Jawaban: monetisasi? EN opsional? Domain? Logo asli?

## 9. Changelog
- 2026-10-24: Proyek dimulai, keputusan awal dicatat.