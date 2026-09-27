create table public.app_events (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'download')),
  created_at timestamptz not null default now()
);

create index app_events_app_id_idx on public.app_events (app_id);
create index app_events_created_at_idx on public.app_events (created_at desc);

alter table public.apps
  add column total_views integer not null default 0,
  add column total_downloads integer not null default 0;

create or replace function public.apply_app_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_type = 'view' then
    update public.apps set total_views = total_views + 1 where id = new.app_id;
  elsif new.event_type = 'download' then
    update public.apps set total_downloads = total_downloads + 1 where id = new.app_id;
  end if;
  return new;
end;
$$;

create trigger app_events_apply
  after insert on public.app_events
  for each row
  execute function public.apply_app_event();

alter table public.app_events enable row level security;

-- Sengaja TIDAK ADA policy insert untuk anon/authenticated di sini.
-- Semua pencatatan event HANYA lewat admin client di server (8.4) —
-- supaya statistik tidak bisa dipalsukan lewat panggilan API langsung.
create policy "Admin bisa melihat semua event"
  on public.app_events for select
  to authenticated
  using (true);

-- Perbarui trigger updated_at dari Fase 2: total_views/total_downloads naik
-- terus karena traffic pengunjung — itu BUKAN berarti aplikasi "diedit",
-- jadi jangan ikut menggeser updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_norm public.apps;
  new_norm public.apps;
begin
  old_norm := old;
  new_norm := new;
  old_norm.total_views := 0;
  new_norm.total_views := 0;
  old_norm.total_downloads := 0;
  new_norm.total_downloads := 0;
  old_norm.updated_at := old.updated_at;
  new_norm.updated_at := old.updated_at;

  if old_norm is distinct from new_norm then
    new.updated_at = now();
  else
    new.updated_at = old.updated_at;
  end if;

  return new;
end;
$$;

-- Aktifkan Realtime untuk dashboard admin
alter publication supabase_realtime add table public.apps;
alter publication supabase_realtime add table public.app_events;