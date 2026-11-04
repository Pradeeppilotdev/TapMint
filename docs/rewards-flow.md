# Direct treasury rewards (no buy / no claim)

## Answers

**Can users buy on our platform / nad.fun?**  
We are **not** building buy/claim. Trading may exist on-chain on nad.fun, but TapMint only does **auto treasury → user transfers**.

**Does treasury get tokens when we create markets?**  
**Yes.** `createToken` with initial buy (2–3 MON) mints/buys tokens into the **creator/treasury wallet**. That inventory is what we distribute as rewards. Remaining supply stays on the bonding curve for the market.

**Is today’s earlier work OK?**  
Markets + Privy gate + TapMint scores are the right base. Buy/claim UI is removed; payouts are **on game end**.

**How scores work with Pradeep’s TapMint?**  
Same TapMint `finish()` score. On round end → `POST /api/rewards/game-end` with wallet + Privy id + score → record in Supabase → `nadSDK.transfer` from treasury.

## Ratio

`REWARD_SCORE_PER_TOKEN=10` → `tokens = floor(score / 10)`.

| Score | Tokens sent |
| --- | --- |
| 0–9 | 0 (recorded as `skipped`) |
| 10–19 | 1 |
| 47 | 4 |

Per-game overrides: `reward_ratios` table in Supabase.

## Setup

1. Create Supabase project  
2. Run `supabase/schema.sql` in SQL editor  
3. Paste into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REWARD_SCORE_PER_TOKEN=10
```

4. Restart `npm run dev`
