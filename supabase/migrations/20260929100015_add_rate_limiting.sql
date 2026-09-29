create table public.rate_limit_hits (
  key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 1,
  primary key (key, window_start)
);

create index rate_limit_hits_window_idx on public.rate_limit_hits (window_start);

create or replace function public.check_rate_limit(p_key text, p_max_hits integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_window timestamptz;
  current_count integer;
begin
  current_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_hits (key, window_start, hit_count)
  values (p_key, current_window, 1)
  on conflict (key, window_start) do update set hit_count = rate_limit_hits.hit_count + 1
  returning hit_count into current_count;

  return current_count <= p_max_hits;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;

alter table public.rate_limit_hits enable row level security;
-- Tidak ada policy sama sekali -- hanya bisa diakses lewat fungsi
-- SECURITY DEFINER di atas, dipanggil dari admin client di server.