create table public.download_sessions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  button_id uuid not null references public.download_buttons(id) on delete cascade,
  current_step smallint not null default 0,
  step1_started_at timestamptz not null default now(),
  step1_completed_at timestamptz,
  step2_started_at timestamptz,
  step2_completed_at timestamptz,
  step3_started_at timestamptz,
  consumed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index download_sessions_expires_at_idx on public.download_sessions (expires_at);

alter table public.download_sessions enable row level security;
-- Sengaja TIDAK ADA satupun policy di tabel ini — anon maupun authenticated
-- sama-sama tidak boleh baca/tulis langsung lewat API Supabase publik.
-- Satu-satunya jalan masuk adalah lewat Route Handler kita, memakai admin client.