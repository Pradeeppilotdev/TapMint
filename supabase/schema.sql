-- TapMint rewards (Monad in Supabase SQL editor)
-- Scores from Pradeep TapMint games + treasury payouts on Monad testnet

create extension if not exists "pgcrypto";

-- Players (Privy identity + wallet)
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  privy_user_id text unique,
  wallet text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per finished round + payout attempt
create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players (id) on delete set null,
  privy_user_id text,
  wallet text not null,
  game_id text not null check (game_id in ('flap', 'mole', 'snake', 'memory')),
  score integer not null check (score >= 0),
  -- reward math
  score_per_token integer not null,
  tokens_amount numeric(36, 18) not null default 0,
  token_symbol text,
  token_address text,
  -- chain
  network text not null default 'testnet',
  tx_hash text,
  status text not null default 'recorded'
    check (status in ('recorded', 'paid', 'skipped', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists game_rounds_wallet_idx on public.game_rounds (lower(wallet));
create index if not exists game_rounds_game_idx on public.game_rounds (game_id);
create index if not exists game_rounds_created_idx on public.game_rounds (created_at desc);

-- Optional: per-game ratio override (null = use env default)
create table if not exists public.reward_ratios (
  game_id text primary key check (game_id in ('flap', 'mole', 'snake', 'memory')),
  score_per_token integer not null check (score_per_token > 0),
  updated_at timestamptz not null default now()
);

insert into public.reward_ratios (game_id, score_per_token) values
  ('flap', 10),
  ('mole', 10),
  ('snake', 10),
  ('memory', 10)
on conflict (game_id) do nothing;

-- Service role from Next.js API only; lock down anon if you enable RLS later
alter table public.players enable row level security;
alter table public.game_rounds enable row level security;
alter table public.reward_ratios enable row level security;

-- No anon policies = client cannot read/write; server uses service role (bypasses RLS)
