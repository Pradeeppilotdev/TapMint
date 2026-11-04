# Where tokens live (testnet)

## Buy / sell — yes

| Venue | Who | How |
| --- | --- | --- |
| **Our platform** `/markets` | User Privy wallet | Bonding-curve `buy` / (sell later) via router |
| **nad.fun** | Anyone | Same on-chain markets; UI on nad.fun once indexed |

Same tokens, same curve. We are not a separate AMM — we call nad.fun contracts / SDK routes.

## Token inventory after create

For each game token (FLAP / MOLE / SNEK / MEMO):

1. **Bonding curve pool** — holds the unsold supply + MON from buys (where “remaining” liquidity lives while pre-graduation).
2. **Treasury wallet** (your `PRIVATE_KEY` / creator) — holds tokens from the **initial buy** (2–3 MON seed). That inventory is what we use to **reward players** (`transfer` from treasury → user).
3. **Player wallets** — receive rewards via claim, or tokens they **buy** themselves.

```
Create + initial buy
        │
        ├─► Curve / pool  (trading liquidity)
        └─► Treasury      (reward inventory from seed buy)
                 │
                 └─► claim/reward ──► user Privy wallet
```

Deploy fee (10 MON each) is paid to the protocol, not held as tokens.

## Gas

- **User buy/sell:** user pays MON gas.
- **Reward transfer:** treasury pays gas (SDK `transfer` server-side).

## Next (distribution rules)

Later: when points convert, caps, per-game pools, claim vs auto-airdrop. Play is already gated so every score has a wallet.
