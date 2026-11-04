# MVP plan — TapMint games × nad.fun meme tokens

Combines: Privy email login, TapMint vertical feed, nad.fun create/trade, and play→reward flows.

Related: [nad-fun-research.md](./nad-fun-research.md) · TapMint: https://github.com/Pradeeppilotdev/TapMint

---

## Product in one line

**Web2 games first** (play with no gas). **Web3 optional** (wallet, trade meme tokens, claim rewards). Games are discovery + engagement; nad.fun is the token economy.

## Current freeze (what we do now)

**TapMint is the main app** (`/` → Privy gate → feed). **No guest / direct play.**

| Order | Work | Status |
| --- | --- | --- |
| **1** | Create nad.fun markets per game | Done (testnet) |
| **2** | Link markets on game cards | Done (`public/tapmint/markets.json`) |
| **3** | Privy-only gate before play | Done (`TapmintShell`) |
| **4** | Points on round finish → later refine distribution | Points API wired; claim rules TBD |
| Later | Distribution economics, sell UI polish, relayer | Next discussion |

See also [token-holdings.md](./token-holdings.md).

---

## Why “Creating…” was stuck (fixed)

Privy’s `createOnLogin` **does not run** for whitelabel email OTP (`loginWithCode`). Wallet must be created with `createWallet()` after login. UI now:

1. Creates embedded wallet if missing  
2. Shows short address + **Copy**  
3. Shows **MON balance** (Monad testnet)

---

## Recommended architecture

```
Player
  │
  ├─ TapMint-style vertical feed (HTML5 games, no chain)
  │     scores → your backend (validated sessions)
  │
  ├─ Privy (email) → embedded Monad wallet
  │
  ├─ Token panel → nad.fun quotes / buy / sell (user signs)
  │
  └─ Reward claim → treasury wallet transfers tokens (server pays gas)
```

| Layer | Choice | Role |
| --- | --- | --- |
| Games | Port TapMint (Flap, Mole, Snake, Memory) | Vertical scroll feed |
| Auth | Privy email | Identity + embedded wallet |
| Chain | Monad (testnet → mainnet) | Assets |
| Markets | nad.fun API + `@nadfun/sdk` / router | Create + trade |
| Backend | Next.js API + DB (Supabase later) | Scores, pools, claims |
| Rewards | **Server treasury** (not user-as-trader) | Transfer tokens to winners |

**Do not** put a hot private key in the browser. **Do not** use `@nadfun/sdk` with `PRIVATE_KEY` on the client.

---

## Gas & rewards: what to use when

| Action | Who pays gas? | How |
| --- | --- | --- |
| **Play game** | Nobody | Pure Web2 |
| **User buys/sells meme token** | User (needs MON) | User wallet signs via Privy + viem/nad router |
| **Distribute reward tokens to player** | **Your treasury** | Server signs `transfer(to, amount)` |
| **Gasless user trades (later)** | Relayer / Privy sponsored txs | Only if product needs it |

### Recommendation for MVP rewards

**Treasury distribution (simplest, correct):**

1. Platform or token sponsor deposits reward tokens into a **treasury wallet** (server-held key or Privy server wallet).
2. Player finishes verified sessions → points/leaderboard.
3. Backend decides payout → treasury calls ERC-20 `transfer(playerWallet, amount)`.
4. Player receives tokens **without signing** and **without paying gas**.

This is **not** “trade for the user with the SDK.” The SDK private-key path is for **your** bots/treasury/ops only.

### When to use a relayer

Use a relayer / sponsored transactions when:

- Users must **buy/sell** without holding MON, or  
- You want claim UX with **user signature** but platform pays gas (meta-tx / Privy gas sponsorship).

MVP: skip relayer. Fund treasury with MON for gas + reward tokens. Ship transfers first.

### Anti-patterns

| Bad idea | Why |
| --- | --- |
| Browser `PRIVATE_KEY` + trade as user | Keys leak; not their wallet |
| Unlimited token mint for every tap | Bots + dumps + trust death |
| Trust client-submitted scores for payouts | Easy to cheat |
| Force wallet before first play | Kills conversion |

---

## Create markets + trade (MVP)

### Create (admin / creator tool)

1. Upload image + metadata via nad.fun API  
2. Mine salt  
3. `createWithNative` from **creator/treasury** wallet (needs MON)  
4. Store `token_address` + link to `game_id` in DB  

### Trade (player)

1. Show token panel on game card (price from API)  
2. Quote via router `getAmountOut`  
3. User signs buy/sell with Privy wallet  
4. Optional: deep-link to nad.fun page for v0  

### Rewards (player)

1. Sponsored pool: X tokens locked for campaign window  
2. Daily/weekly leaderboard from **server-validated** scores  
3. Claim or auto-airdrop from treasury  

---

## Game ↔ token link model

```
Game (TapMint id) ──< GameToken >── token_address (nad.fun)
                      reward_pool_id (optional)
```

- One game can attach one (or few) meme tokens.  
- Token does **not** need on-chain game logic.  
- Association is **metadata** in your DB.

---

## Phased next steps

### Phase 0 — Done / in progress
- [x] Next.js + Privy email  
- [x] Manual wallet create + short address + copy + MON balance  
- [x] nad.fun research doc  
- [x] Testnet markets for all 4 TapMint games (FLAP / MOLE / SNEK / MEMO) via SDK  
- [x] Seed liquidity (2–3 MON initial buy each) + logos/metadata  
- [x] `/markets` UI: demo points → treasury claim + user buy  

### Phase 1 — Playable feed (Web2)
- [ ] Port TapMint feed into Next.js (`/play`)  
- [ ] Keep 3–4 games; local scores first  
- [ ] Optional login (play without wallet)  

### Phase 2 — Identity + wallet UX
- [ ] Login gate only for leaderboard / claim / trade  
- [ ] Show wallet chip in feed (short addr + MON)  
- [ ] Faucet link for testnet MON  

### Phase 3 — Markets MVP
- [ ] Admin: create token on testnet (nad.fun flow)  
- [ ] Bind token → game in DB  
- [ ] Token panel: price, buy/sell (user-signed) or nad.fun link  

### Phase 4 — Rewards MVP
- [ ] Score ingestion API with anti-cheat basics (session id, duration bounds)  
- [ ] Reward pool table + deposit  
- [ ] Treasury `transfer` payout job / claim endpoint  
- [ ] Show claimable balance in UI  

### Phase 5 — Polish / mainnet
- [ ] Relayer or Privy gas sponsorship (only if needed)  
- [ ] Creator submit flow / AI games later  
- [ ] Mainnet + legal review for trading in target regions  

---

## Suggested reward economics (psychology)

| Who | Motivation |
| --- | --- |
| Player | Fun + competition + occasional token drip |
| Token community | Attention / culture / optional speculation |
| Creator/sponsor | Distribution; funds a **finite** pool |

Buyers of the meme token are usually **community / speculation**, not “paying for gameplay.” Games create **attention**; pools create **claimable rewards**. Keep those separate in UX copy.

---

## Immediate build order (this week)

1. Confirm wallet panel works after refresh (logout → login once).  
2. Add `/play` route and embed TapMint games.  
3. Add `game_tokens` + `reward_pools` schema.  
4. Script: create one testnet token with nad.fun; attach to one game.  
5. API: `POST /api/rewards/payout` (treasury transfer) after manual leaderboard.

---

## Sources

- TapMint README (Web2 vertical feed, no wallet yet)  
- nad.fun API / `@nadfun/sdk` / V2 router docs  
- Privy: whitelabel login requires manual `createWallet()`  
- Product discussion: playables + meme tokens + sponsored pools  
