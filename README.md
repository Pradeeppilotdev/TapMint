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
