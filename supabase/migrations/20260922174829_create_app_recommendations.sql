create table public.app_recommendations (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  recommended_app_id uuid not null references public.apps(id) on delete cascade,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint app_recommendations_not_self check (app_id <> recommended_app_id),
  constraint app_recommendations_unique unique (app_id, recommended_app_id)
);

create index app_recommendations_app_id_idx on public.app_recommendations (app_id);

create or replace function public.enforce_max_recommendations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  select count(*) into current_count from public.app_recommendations where app_id = new.app_id;
  if current_count >= 3 then
    raise exception 'Maksimal 3 rekomendasi aplikasi';
  end if;
  return new;
end;
$$;

create trigger app_recommendations_max_check
  before insert on public.app_recommendations
  for each row
  execute function public.enforce_max_recommendations();

alter table public.app_recommendations enable row level security;

create policy "Publik bisa melihat rekomendasi aplikasi published"
  on public.app_recommendations for select
  to anon
  using (exists (select 1 from public.apps where apps.id = app_recommendations.app_id and apps.is_published = true));

create policy "Admin bisa melihat semua rekomendasi"
  on public.app_recommendations for select
  to authenticated
  using (true);

create policy "Admin bisa menambah rekomendasi"
  on public.app_recommendations for insert
  to authenticated
  with check (true);

create policy "Admin bisa mengubah rekomendasi"
  on public.app_recommendations for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin bisa menghapus rekomendasi"
  on public.app_recommendations for delete
  to authenticated
  using (true);