-- Paper trade log for engine-generated demo trades

create table if not exists public.paper_trade_logs (
  id uuid primary key default gen_random_uuid(),
  engine_trade_id text not null,
  symbol text not null,
  side text not null,
  quantity numeric not null,
  price numeric not null,
  value_gbp numeric not null,
  status text not null,
  reason text,
  cash_gbp numeric,
  created_at timestamptz not null default now()
);

alter table public.paper_trade_logs enable row level security;

create policy "Public can read paper trade logs"
on public.paper_trade_logs
for select
using (true);
