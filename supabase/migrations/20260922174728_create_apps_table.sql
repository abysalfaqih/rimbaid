-- Fungsi generik: auto-update kolom updated_at di setiap UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique,
  logo_url text,
  description text not null default '',
  size_label text,
  version text,
  is_published boolean not null default false,
  is_new_update boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.apps.slug is
  'Dibuat otomatis dari nama aplikasi saat insert, tidak boleh diubah lagi (dijaga trigger protect_apps_slug)';

create index apps_is_published_idx on public.apps (is_published);

-- Hanya boleh ada 1 aplikasi dengan is_new_update = true di seluruh tabel
create unique index apps_single_new_update_idx
  on public.apps (is_new_update)
  where is_new_update = true;

create trigger apps_set_updated_at
  before update on public.apps
  for each row
  execute function public.set_updated_at();

-- Lapisan pertahanan kedua: slug tidak bisa diubah walau ada yang mencoba lewat query langsung
create or replace function public.protect_apps_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slug <> old.slug then
    raise exception 'Slug aplikasi tidak dapat diubah setelah dibuat';
  end if;
  return new;
end;
$$;

create trigger apps_protect_slug
  before update on public.apps
  for each row
  execute function public.protect_apps_slug();

-- Fungsi atomik: mengaktifkan "New Update" pada 1 aplikasi,
-- otomatis menonaktifkan yang sebelumnya (sesuai requirement Anda)
create or replace function public.set_new_update_app(target_app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.apps set is_new_update = false where is_new_update = true and id <> target_app_id;
  update public.apps set is_new_update = true where id = target_app_id;
end;
$$;

revoke all on function public.set_new_update_app(uuid) from public;
grant execute on function public.set_new_update_app(uuid) to authenticated;

create or replace function public.clear_new_update_app(target_app_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.apps set is_new_update = false where id = target_app_id;
end;
$$;

revoke all on function public.clear_new_update_app(uuid) from public;
grant execute on function public.clear_new_update_app(uuid) to authenticated;

alter table public.apps enable row level security;

create policy "Publik bisa melihat aplikasi yang published"
  on public.apps for select
  to anon
  using (is_published = true);

create policy "Admin bisa melihat semua aplikasi"
  on public.apps for select
  to authenticated
  using (true);

create policy "Admin bisa menambah aplikasi"
  on public.apps for insert
  to authenticated
  with check (true);

create policy "Admin bisa mengubah aplikasi"
  on public.apps for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin bisa menghapus aplikasi"
  on public.apps for delete
  to authenticated
  using (true);