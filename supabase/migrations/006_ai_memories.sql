create table if not exists public.ai_memories (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    signal_id uuid
        references public.ai_signals(id)
        on delete set null,

    symbol text not null,
    action text not null
        check (action in ('BUY', 'SELL', 'HOLD')),

    confidence integer not null
        check (confidence between 0 and 100),

    executed boolean not null default false,
    reason text,

    market_snapshot jsonb not null default '{}'::jsonb,
    portfolio_snapshot jsonb not null default '{}'::jsonb,

    entry_price numeric,
    outcome_1h numeric,
    outcome_24h numeric,
    outcome_7d numeric,

    success_score numeric
        check (
            success_score is null
            or success_score between 0 and 100
        ),

    lesson text,
    reviewed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists ai_memories_user_created_idx
on public.ai_memories (
    user_id,
    created_at desc
);

create index if not exists ai_memories_pending_review_idx
on public.ai_memories (
    reviewed_at,
    created_at
)
where reviewed_at is null;

create index if not exists ai_memories_symbol_action_idx
on public.ai_memories (
    user_id,
    symbol,
    action,
    created_at desc
);

alter table public.ai_memories
enable row level security;

drop policy if exists "Users can read own AI memories"
on public.ai_memories;

create policy "Users can read own AI memories"
on public.ai_memories
for select
to authenticated
using (auth.uid() = user_id);

comment on table public.ai_memories is
'Per-user AI decision memories with market context, portfolio context, and later performance outcomes.';
