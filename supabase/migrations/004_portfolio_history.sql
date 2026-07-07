create table if not exists public.portfolio_history (
    id uuid primary key default gen_random_uuid(),
    portfolio_value numeric not null,
    cash numeric not null,
    invested numeric not null,
    unrealized_pnl numeric not null,
    btc_price numeric not null,
    created_at timestamptz default now()
);

alter table public.portfolio_history enable row level security;

drop policy if exists "Public can read portfolio history"
on public.portfolio_history;

create policy "Public can read portfolio history"
on public.portfolio_history
for select
using (true);
