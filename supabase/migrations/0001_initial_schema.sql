create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  subscription_tier text not null default 'starter',
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.exchange_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exchange text not null,
  label text not null,
  encrypted_api_key text,
  encrypted_api_secret text,
  is_live_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  mode text not null default 'paper',
  status text not null default 'paused',
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  symbol text not null,
  side text not null,
  quantity numeric not null,
  price numeric,
  mode text not null default 'paper',
  status text not null,
  pnl numeric not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  symbol text not null,
  quantity numeric not null default 0,
  avg_entry numeric not null default 0,
  mode text not null default 'paper',
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.exchange_accounts enable row level security;
alter table public.strategies enable row level security;
alter table public.trades enable row level security;
alter table public.positions enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles own rows" on public.profiles for select using (auth.uid() = id);
create policy "exchange own rows" on public.exchange_accounts for all using (auth.uid() = user_id);
create policy "strategies own rows" on public.strategies for all using (auth.uid() = user_id);
create policy "trades own rows" on public.trades for all using (auth.uid() = user_id);
create policy "positions own rows" on public.positions for all using (auth.uid() = user_id);
create policy "audit own rows" on public.audit_logs for select using (auth.uid() = user_id);
