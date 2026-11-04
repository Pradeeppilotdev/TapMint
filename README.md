# TapMint (Devcon)

Privy-gated vertical game feed + nad.fun meme markets on **Monad testnet**.

## Run

```bash
npm install
npm run sync-markets   # copies data/markets.json → public/tapmint/
npm run dev
```

Open http://localhost:3000 — **email login required**, then TapMint loads. No guest play.

## Layout

| Path | Role |
| --- | --- |
| `/` | Privy gate → TapMint feed (main) |
| `/markets` | Buy + claim rewards |
| `/tapmint/` | Static TapMint (iframe, wallet-injected) |
| `tapmint/` | Upstream source clone (reference) |
| `data/markets.json` | Created token addresses |

## Commands

```bash
npm run generate-logos
npm run create-markets   # testnet only — needs PRIVATE_KEY + MON
npm run sync-markets
```

## Docs

- [docs/mvp-plan.md](./docs/mvp-plan.md)
- [docs/nad-fun-research.md](./docs/nad-fun-research.md)
- [docs/token-holdings.md](./docs/token-holdings.md)

Upstream games: [Pradeeppilotdev/TapMint](https://github.com/Pradeeppilotdev/TapMint)

## Wallet and game history

The original Monad arcade layout is preserved. The top-right Privy wallet opens earned token totals, paginated round history, payout status, transaction receipts, and network-specific nad.fun links. Opening the panel pauses play.

Set `PRIVY_VERIFICATION_KEY` to the public ES256 verification key from the Privy dashboard, in addition to the existing Privy and Supabase settings. Use PEM format (literal `\n` line breaks are accepted). History and game-end requests verify the signed-in user; history is scoped to that user and wallet. No schema migration is required. Development without a Privy app ID provides a game preview without rewards.

Run `npm test`, `npm run lint`, and `npm run build`. Live authentication and treasury transfers require your private environment configuration. Existing reward scoring still comes from the client; server score validation and replay protection remain necessary before a public reward launch.
