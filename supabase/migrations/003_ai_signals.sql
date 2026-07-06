create table if not exists public.ai_signals (
    id uuid primary key default gen_random_uuid(),
    symbol text not null,
    action text not null,
    confidence integer not null,
    reason text,
    executed boolean default false,
    created_at timestamptz default now()
);

alter table public.ai_signals enable row level security;

drop policy if exists "Public can read AI signals" on public.ai_signals;

create policy "Public can read AI signals"
on public.ai_signals
for select
using (true);
