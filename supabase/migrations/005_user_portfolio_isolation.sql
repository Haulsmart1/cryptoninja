-- Add per-user ownership to all trading records.
-- Existing legacy rows remain unassigned and will not be visible to normal users.

alter table public.paper_trade_logs
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.ai_signals
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.portfolio_history
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists paper_trade_logs_user_created_idx
on public.paper_trade_logs (user_id, created_at desc);

create index if not exists ai_signals_user_created_idx
on public.ai_signals (user_id, created_at desc);

create index if not exists portfolio_history_user_created_idx
on public.portfolio_history (user_id, created_at desc);

drop policy if exists "Public can read paper trade logs"
on public.paper_trade_logs;

drop policy if exists "Public can read AI signals"
on public.ai_signals;

drop policy if exists "Public can read portfolio history"
on public.portfolio_history;

drop policy if exists "Users can read own paper trades"
on public.paper_trade_logs;

drop policy if exists "Users can read own AI signals"
on public.ai_signals;

drop policy if exists "Users can read own portfolio history"
on public.portfolio_history;

create policy "Users can read own paper trades"
on public.paper_trade_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own AI signals"
on public.ai_signals
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own portfolio history"
on public.portfolio_history
for select
to authenticated
using (auth.uid() = user_id);
