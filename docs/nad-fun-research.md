# nad.fun on Monad — Integration Research

nad.fun is a meme-token launchpad on **Monad** (bonding curve → DEX graduation), similar in spirit to pump.fun. You integrate via **REST API** (metadata, markets, charts) and **on-chain contracts / SDKs** (create, buy, sell, transfer).

**Product / MVP flow (games × tokens × rewards):** see [mvp-plan.md](./mvp-plan.md).

---

## Networks & endpoints

| Network | Chain ID | API base |
| --- | --- | --- |
| Mainnet | `143` | `https://api.nad.fun` |
| Testnet | `10143` | `https://dev-api.nadapp.net` |

- Addresses are EVM `0x…` (42 chars).
- Prices/amounts come back as **strings** — parse with `bigint` / decimal libs, not JS `number`.
- External callers: ~10 req/min without key, ~100 req/min with `X-API-Key: nadfun_…`.

### How to get a nad.fun API key

External calls work **without** a key at ~10 req/min. For build/prod, get a key (~100 req/min):

1. Use a funded Monad wallet (testnet or mainnet matching the API).
2. `POST {BASE_URL}/auth/nonce` with `{ "address": "0xYourWallet" }`.
3. Sign the **exact** returned `nonce` string with that wallet (no whitespace edits).
4. `POST {BASE_URL}/auth/session` with `{ signature, nonce, chain_id }`  
   - Testnet `chain_id`: `10143` · Mainnet: `143`
5. With the session cookie: `POST {BASE_URL}/api-key`  
   `{ "name": "Devcon", "description": "MVP", "expires_in_days": 365 }`
6. Save `api_key` (`nadfun_…`) **once** — it is not shown again. Send as header:  
   `X-API-Key: nadfun_…`

Bases: testnet `https://dev-api.nadapp.net` · mainnet `https://api.nad.fun`

Metadata/create endpoints (image, metadata, salt) are usable for launching markets; trading market data uses `/trade/*` and `/token/*`.

### API key flow (short)

1. `POST /auth/nonce` → `{ address }`
2. Sign the exact nonce string with the wallet
3. `POST /auth/session` → session cookie
4. `POST /api-key` → full key returned **once**

---

## What you can build

| Capability | How |
| --- | --- |
| Create a market/token | API metadata + salt, then `NadFunRouter.create` / `createWithNative` |
| Trade (buy/sell) | Router + TS/Rust/Python SDK |
| Quotes | `getAmountOut` / `getAmountIn` (lifecycle-aware) |
| Market data | REST: market, chart, metrics, swaps, holders |
| Transfer tokens | ERC-20 `transfer` / SDK `transfer` |
| Gasless approve | EIP-2612 `permit` + `*WithPermit` router methods |
| Live events | SDK WebSocket curve/DEX streams |
| History | SDK indexers over block ranges |

**Lifecycle:** pre-graduation trades hit the **bonding curve**; after graduation the same router routes to the **DEX pair**. You usually do not pick the venue yourself.

---

## Creating markets (token launch)

### Off-chain (API)

1. `POST /metadata/image` — raw image bytes (`jpeg|png|webp|svg`, ≤5MB) → `image_uri`
2. `POST /metadata/metadata` — name, symbol, description, socials + `image_uri` → `metadata_uri`  
   Call soon after image upload (NSFW cache can expire).
3. `POST /token/salt` — `{ creator, name, symbol, metadata_uri, version?: "V2" }` → vanity `salt` + predicted `address`

### On-chain (NadFunRouter V2)

```text
create(CreateParams)           // ERC-20 quote (approve deployFee + buyQuoteAmount)
createWithNative(CreateParams) // pay with native MON (WMON / LVMon quotes)
```

Important `CreateParams` fields:

| Field | Notes |
| --- | --- |
| `name` / `symbol` / `tokenURI` | Must match salt/metadata |
| `quoteToken` | e.g. WMON or LVMon (registered quotes) |
| `creatorFeeRate` | BPS; commonly `100` / `300` / `500` (1% / 3% / 5%) |
| `vaults` | Fee split; total `bps` = `10000`, ≤5 vaults |
| `salt` | From `/token/salt` |
| `dexType` | V2 path uses Uniswap V2–style (`0`) |
| `buyQuoteAmount` | Initial buy in quote; `0` = no initial buy |
| `deadline` | Unix seconds |

SDK shortcut (`@nadfun/sdk`):

```ts
await nadSDK.createToken({
  name, symbol, description, image, imageContentType,
  website, twitter, telegram, initialBuyAmount,
})
```

That wraps image → metadata → salt → on-chain create.

---

## Trading

Router auto-routes curve vs DEX. Prefer router quotes for UI.

### Exact-in

| Method | Pays with | Needs approve? |
| --- | --- | --- |
| `buy` | Quote ERC-20 | Quote → router |
| `buyWithNative` | Native MON (`msg.value`) | No |
| `sell` | Token | Token → router |
| `sellToNative` | Token → MON | Token → router |

### Exact-out

`exactOutBuy`, `exactOutBuyWithNative`, `exactOutSell`, `exactOutSellToNative` — use `amountInMax` / refund unused native.

### Permit (gasless approve)

`buyWithPermit`, `sellWithPermit`, `sellToNativeWithPermit` when tokens support ERC-2612.

### TS SDK trading

```ts
import { initSDK, parseEther } from '@nadfun/sdk'

const nadSDK = initSDK({
  rpcUrl: process.env.RPC_URL!,
  privateKey: process.env.PRIVATE_KEY! as `0x${string}`,
  network: 'testnet', // or 'mainnet'
})

await nadSDK.simpleBuy({
  token: '0x...',
  amountIn: parseEther('0.1'),
  slippagePercent: 1,
})

await nadSDK.simpleSell({
  token: '0x...',
  amountIn: parseEther('1000'),
  slippagePercent: 1,
})

const quote = await nadSDK.getAmountOut(token, amountIn, true) // true = buy
```

Also: low-level `buy` / `sell` / `sellPermit`, gas estimation, curve state (`getCurveState`, `getProgress`, `isGraduated`).

---

## Token transfers

All Nad.fun tokens use **18 decimals**. Amounts are raw `bigint`.

### Via SDK

```ts
await nadSDK.transfer(token, to, amount)
await nadSDK.approve(token, spender, amount)
const balance = await nadSDK.getBalance(token)
const permit = await nadSDK.generatePermitSignature(token, spender, amount, deadline)
```

### Via viem / ERC-20

```ts
await walletClient.writeContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'transfer',
  args: [toAddress, amount],
})
```

`transferFrom` needs prior allowance. Prefer `permit` when you want approve+trade in one UX step.

---

## Market / read API (no wallet)

| Endpoint | Purpose |
| --- | --- |
| `GET /token/:token` | Token + creator |
| `GET /token/metadata/:token_id` | Token + market |
| `GET /trade/market/:token_id` | Reserves, price, volume, holders |
| `GET /trade/chart/:token_id` | OHLCV (`resolution`, `from`, `to`, `countback`) |
| `GET /trade/metrics/:token_id?timeframes=1,5,15,...` | Volume / makers / % change |
| `GET /trade/swap-history/:token_id` | Paginated buys/sells |
| `GET /trade/holder/:token_id` | Holder balances |

`market_type`: `CURVE` \| `DEX` \| `V2_CURVE` \| `V2_DEX`.

---

## SDKs

| Package | Lang | Notes |
| --- | --- | --- |
| [`@nadfun/sdk`](https://www.npmjs.com/package/@nadfun/sdk) | TypeScript (viem) | Create, trade, token ops, streams, indexers |
| [`nadfun-sdk`](https://pypi.org/project/nadfun-sdk/) | Python | Token + trading helpers |
| [`nadfun_sdk`](https://docs.rs/nadfun_sdk) | Rust | V2 `CoreV2` create/buy/sell + `ApiClient` |

Official integration repos:

- [Naddotfun/api-intergration](https://github.com/Naddotfun/api-intergration) — REST + create flow
- [Naddotfun/nadfun-v2-intergration](https://github.com/Naddotfun/nadfun-v2-intergration) — Router / bonding curve / DEX ABIs

---

## Key contract addresses

### V2 router (preferred for create + trade)

| Network | NadFunRouter |
| --- | --- |
| Testnet | `0x75588668999cA0557b78046b8a5E86b47b9234ec` |
| Mainnet | `0x8986C8fD44eb85294A725a7e61AF35E76bA26F91` |

Quote tokens (examples): **WMON**, **LVMon** (native flows wrap/mint via router).

Confirm addresses against latest deploy docs before mainnet production.

### Older TS SDK contract map (V1-style routers)

Still useful for `@nadfun/sdk` network constants — bonding curve router + DEX router + Lens + Curve + WMON + V3 factory on testnet/mainnet. Prefer V2 `NadFunRouter` for new integrations when following the V2 ABI repos.

---

## Privy + nad.fun app pattern

1. User logs in with **email OTP** (Privy).
2. Privy creates an **embedded Monad wallet**.
3. Use that wallet to:
   - sign API auth / API keys (optional),
   - call `create` / `buy` / `sell` / `transfer`,
   - fund with MON for gas + native trades.

Server-side bots can keep using `PRIVATE_KEY` with `@nadfun/sdk`; user-facing apps should use the Privy wallet client + viem/`@nadfun/sdk` patterns instead of exposing keys.

---

## Practical checklist

- [ ] Pick testnet first (`dev-api.nadapp.net`, chain `10143`)
- [ ] Create token: image → metadata → salt → `createWithNative`
- [ ] Quote with router `getAmountOut` before every trade
- [ ] Set slippage (`amountOutMin`) and short `deadline`
- [ ] Approve quote/token to router (or use permit / native)
- [ ] Transfer with ERC-20 `transfer` (18 decimals)
- [ ] Use API for charts/holders; on-chain for state of truth on trades
- [ ] Respect rate limits / store API key securely

## Sources

- https://github.com/Naddotfun/api-intergration
- https://github.com/Naddotfun/nadfun-v2-intergration
- https://www.npmjs.com/package/@nadfun/sdk
- https://nad.fun/abi.md / https://nad.fun/token.md
- https://docs.rs/nadfun_sdk
