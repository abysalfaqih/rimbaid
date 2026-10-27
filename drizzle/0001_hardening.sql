-- MIGRASI "HARDENING": hal-hal yang tidak bisa diungkapkan lewat skema Drizzle.
-- Setiap pernyataan dipisah penanda khusus drizzle-kit (baris "statement-breakpoint").
-- JANGAN menulis penanda itu di dalam komentar: drizzle memotong berkas di setiap kemunculannya.
-- Semua fungsi memakai `SET search_path = ''` dan nama lengkap (public.*, pg_catalog.*),
-- sesuai rekomendasi keamanan Supabase (mencegah pembajakan lewat search_path).

-- 1) updated_at diperbarui OTOMATIS oleh database, hanya jika isi baris benar-benar berubah.
CREATE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER apps_set_updated_at
BEFORE UPDATE ON public.apps
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER app_downloads_set_updated_at
BEFORE UPDATE ON public.app_downloads
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint
CREATE TRIGGER legal_pages_set_updated_at
BEFORE UPDATE ON public.legal_pages
FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.set_updated_at();
--> statement-breakpoint

-- 2) Slug aplikasi tidak boleh pernah berubah (URL dan SEO bergantung padanya).
CREATE FUNCTION public.apps_prevent_slug_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'apps.slug tidak boleh diubah' USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER apps_slug_immutable
BEFORE UPDATE OF slug ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.apps_prevent_slug_change();
--> statement-breakpoint

-- 3) published_at terisi otomatis saat sebuah aplikasi pertama kali berstatus published.
--    (Berjalan sebelum CHECK "apps_published_complete" dievaluasi.)
CREATE FUNCTION public.apps_set_published_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := pg_catalog.now();
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER apps_published_at_auto
BEFORE INSERT OR UPDATE ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.apps_set_published_at();
--> statement-breakpoint

-- 4) "New Update" eksklusif: menandai satu aplikasi otomatis menurunkan yang lama.
--    Seluruhnya satu pernyataan, jadi atomik: kalau yang baru ditolak CHECK
--    (mis. belum published), yang lama tidak ikut turun.
CREATE FUNCTION public.apps_demote_other_featured() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_featured THEN
    UPDATE public.apps SET is_featured = false WHERE is_featured AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER apps_featured_exclusive
BEFORE INSERT OR UPDATE OF is_featured ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.apps_demote_other_featured();
--> statement-breakpoint

-- 5) Cabut semua hak role API Supabase (anon, authenticated, service_role) atas tabel kita,
--    DAN atas tabel yang dibuat di masa depan. Dijaga IF EXISTS agar migrasi tetap jalan
--    di Postgres biasa yang tidak punya role-role itu (mis. pengujian lokal).
--    Lapis keamanan: (a) Data API dimatikan, (b) hak dicabut di sini, (c) RLS aktif tanpa
--    kebijakan. Aplikasi memakai koneksi Postgres langsung, tidak terpengaruh.
DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
    END IF;
  END LOOP;
END;
$$;
--> statement-breakpoint

-- 6) Tiga halaman legal tetap ada. Isinya sementara; diedit lewat admin di Fase 7.
INSERT INTO public.legal_pages (slug, title_id, title_en, body_id, body_en) VALUES
  ('terms', 'Syarat Layanan', 'Terms of Service',
   'Dokumen ini sedang disiapkan.', 'This document is being prepared.'),
  ('privacy', 'Kebijakan Privasi', 'Privacy Policy',
   'Dokumen ini sedang disiapkan.', 'This document is being prepared.'),
  ('disclaimer', 'Penafian', 'Disclaimer',
   'Dokumen ini sedang disiapkan.', 'This document is being prepared.')
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint

-- 7) Peringatan permanen di dalam database untuk siapa pun yang membukanya.
COMMENT ON TABLE public.app_downloads IS
  'PRIVAT: berisi tautan unduhan asli. Jangan pernah dipilih (url) di kueri halaman publik; hanya dibaca server setelah verifikasi unduhan selesai.';
