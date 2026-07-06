-- CryptoNinja AI core schema

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null default 'starter',
  status text not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exchange_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exchange text not null,
  label text not null,
  api_key_encrypted text,
  api_secret_encrypted text,
  is_paper boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  mode text not null default 'paper',
  status text not null default 'paused',
  config jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  symbol text not null,
  side text not null,
  quantity numeric not null default 0,
  entry_price numeric,
  mark_price numeric,
  unrealized_pnl numeric not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strategy_id uuid references public.strategies(id) on delete set null,
  exchange_account_id uuid references public.exchange_accounts(id) on delete set null,
  symbol text not null,
  side text not null,
  quantity numeric not null,
  price numeric,
  fee numeric not null default 0,
  mode text not null default 'paper',
  status text not null default 'filled',
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.exchange_accounts enable row level security;
alter table public.strategies enable row level security;
alter table public.positions enable row level security;
alter table public.trades enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read own profile" on public.profiles
for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id);

create policy "Users can read own subscriptions" on public.subscriptions
for select using (auth.uid() = user_id);

create policy "Users can read own exchange accounts" on public.exchange_accounts
for select using (auth.uid() = user_id);

create policy "Users can manage own strategies" on public.strategies
for all using (auth.uid() = user_id);

create policy "Users can read own positions" on public.positions
for select using (auth.uid() = user_id);

create policy "Users can read own trades" on public.trades
for select using (auth.uid() = user_id);

create policy "Users can read own audit logs" on public.audit_logs
for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'starter', 'inactive')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
