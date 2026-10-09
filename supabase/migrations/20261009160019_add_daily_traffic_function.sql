create or replace function public.get_daily_traffic(p_days integer default 30)
returns table (day date, views bigint, downloads bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    d::date as day,
    count(e.id) filter (where e.event_type = 'view') as views,
    count(e.id) filter (where e.event_type = 'download') as downloads
  from generate_series(
    (now() at time zone 'Asia/Jakarta')::date - (greatest(p_days, 1) - 1),
    (now() at time zone 'Asia/Jakarta')::date,
    interval '1 day'
  ) as d
  left join public.app_events e
    on (e.created_at at time zone 'Asia/Jakarta')::date = d::date
  group by d
  order by d;
$$;

revoke all on function public.get_daily_traffic(integer) from public, anon;
grant execute on function public.get_daily_traffic(integer) to authenticated;