insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('app-logos', 'app-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('app-screenshots', 'app-screenshots', true, 5242880, array['image/png','image/jpeg','image/webp']);

-- Publik boleh membaca gambar (logo & screenshot memang tampil di halaman publik)
create policy "Publik bisa melihat logo aplikasi"
  on storage.objects for select
  to anon
  using (bucket_id = 'app-logos');

create policy "Publik bisa melihat screenshot aplikasi"
  on storage.objects for select
  to anon
  using (bucket_id = 'app-screenshots');

-- Hanya admin yang bisa upload/ubah/hapus file
create policy "Admin bisa upload logo"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'app-logos');

create policy "Admin bisa upload screenshot"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'app-screenshots');

create policy "Admin bisa update file storage"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('app-logos', 'app-screenshots'))
  with check (bucket_id in ('app-logos', 'app-screenshots'));

create policy "Admin bisa hapus file storage"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('app-logos', 'app-screenshots'));