create table public.app_screenshots (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  image_url text not null,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index app_screenshots_app_id_idx on public.app_screenshots (app_id);

create or replace function public.enforce_max_screenshots()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  max_allowed constant integer := 6; -- lihat catatan asumsi di bawah
begin
  select count(*) into current_count from public.app_screenshots where app_id = new.app_id;
  if current_count >= max_allowed then
    raise exception 'Maksimal % screenshot per aplikasi', max_allowed;
  end if;
  return new;
end;
$$;

create trigger app_screenshots_max_check
  before insert on public.app_screenshots
  for each row
  execute function public.enforce_max_screenshots();

alter table public.app_screenshots enable row level security;

create policy "Publik bisa melihat screenshot aplikasi published"
  on public.app_screenshots for select
  to anon
  using (exists (select 1 from public.apps where apps.id = app_screenshots.app_id and apps.is_published = true));

create policy "Admin bisa melihat semua screenshot"
  on public.app_screenshots for select
  to authenticated
  using (true);

create policy "Admin bisa menambah screenshot"
  on public.app_screenshots for insert
  to authenticated
  with check (true);

create policy "Admin bisa mengubah screenshot"
  on public.app_screenshots for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin bisa menghapus screenshot"
  on public.app_screenshots for delete
  to authenticated
  using (true);