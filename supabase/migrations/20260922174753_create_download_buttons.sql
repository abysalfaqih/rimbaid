create table public.download_buttons (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  label text not null check (char_length(trim(label)) > 0),
  url text not null check (url ~* '^https?://'),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index download_buttons_app_id_idx on public.download_buttons (app_id);

-- Maksimal 3 tombol download per aplikasi (sesuai requirement Anda)
create or replace function public.enforce_max_download_buttons()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  select count(*) into current_count from public.download_buttons where app_id = new.app_id;
  if current_count >= 3 then
    raise exception 'Maksimal 3 tombol download per aplikasi';
  end if;
  return new;
end;
$$;

create trigger download_buttons_max_check
  before insert on public.download_buttons
  for each row
  execute function public.enforce_max_download_buttons();

alter table public.download_buttons enable row level security;

-- PENTING: sengaja TIDAK ada policy SELECT untuk role "anon" di tabel ini.
-- Artinya publik TIDAK BISA membaca tabel ini sama sekali lewat API,
-- termasuk kolom url. Link asli hanya boleh dibaca dari server memakai
-- service role key, setelah verifikasi 3-step selesai (Fase 6).
create policy "Admin bisa melihat semua tombol download"
  on public.download_buttons for select
  to authenticated
  using (true);

create policy "Admin bisa menambah tombol download"
  on public.download_buttons for insert
  to authenticated
  with check (true);

create policy "Admin bisa mengubah tombol download"
  on public.download_buttons for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin bisa menghapus tombol download"
  on public.download_buttons for delete
  to authenticated
  using (true);