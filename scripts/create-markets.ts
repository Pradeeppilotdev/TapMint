/**
 * Create nad.fun testnet markets for each TapMint game.
 *
 *   npm run create-markets
 */
import fs from "fs";
import path from "path";
import { config as loadEnv } from "dotenv";
import { formatEther, initSDK, parseEther } from "@nadfun/sdk";

loadEnv({ path: ".env.local" });

const API = "https://dev-api.nadapp.net";

const GAMES = [
  {
    id: "flap",
    name: "FlapCoin",
    symbol: "FLAP",
    description: "Meme token for Pocket Flap on TapMint. Play, score, earn.",
    initialBuyMon: "2",
  },
  {
    id: "mole",
    name: "MoleCoin",
    symbol: "MOLE",
    description: "Meme token for Mole Patrol on TapMint. Whack and win.",
    initialBuyMon: "2",
  },
  {
    id: "snake",
    name: "SnekCoin",
    symbol: "SNEK",
    description: "Meme token for Mint Condition (Snake) on TapMint.",
    initialBuyMon: "3",
  },
  {
    id: "memory",
    name: "MemoCoin",
    symbol: "MEMO",
    description: "Meme token for Double Take (Memory) on TapMint.",
    initialBuyMon: "2",
  },
] as const;

type MarketRecord = {
  gameId: string;
  name: string;
  symbol: string;
  tokenAddress: string;
  poolAddress: string;
  transactionHash: string;
  imageUri: string;
  metadataUri: string;
  initialBuyMon: string;
  network: "testnet";
  createdAt: string;
};

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  const rpcUrl = process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz";

  if (!privateKey?.startsWith("0x")) {
    throw new Error("PRIVATE_KEY missing in .env.local");
  }

  // Sanity: API reachable
  const ping = await fetch(API).catch(() => null);
  if (!ping) {
    throw new Error(`Cannot reach ${API}`);
  }

  const nadSDK = initSDK({
    rpcUrl,
    privateKey,
    network: "testnet",
  });

  console.log("Network: testnet");
  console.log("Creator:", nadSDK.account.address);
  console.log("API:", API);

  const bal = await nadSDK.publicClient.getBalance({
    address: nadSDK.account.address,
  });
  console.log("Balance:", formatEther(bal), "MON\n");

  const feeConfig = await nadSDK.getFeeConfig();
  console.log("Deploy fee:", formatEther(feeConfig.deployFeeAmount), "MON\n");

  const outPath = path.join(process.cwd(), "data", "markets.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  let existing: MarketRecord[] = [];
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8")) as MarketRecord[];
  }

  const markets: MarketRecord[] = [...existing];

  for (const game of GAMES) {
    if (markets.some((m) => m.gameId === game.id && m.network === "testnet")) {
      console.log(`Skip ${game.symbol} — already in markets.json`);
      continue;
    }

    const imagePath = path.join(process.cwd(), "assets", "token-logos", `${game.id}.png`);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Missing logo: ${imagePath} (run: npm run generate-logos)`);
    }

    const image = fs.readFileSync(imagePath);
    const initialBuyAmount = parseEther(game.initialBuyMon);

    console.log(`\n=== Creating ${game.name} ($${game.symbol}) ===`);
    console.log("Initial buy:", game.initialBuyMon, "MON");

    if (initialBuyAmount > 0n) {
      const expected = await nadSDK.getInitialBuyAmountOut(initialBuyAmount);
      console.log("Expected tokens:", formatEther(expected));
    }

    const result = await nadSDK.createToken({
      name: game.name,
      symbol: game.symbol,
      description: game.description,
      image,
      imageContentType: "image/png",
      website: "https://nad.fun",
      initialBuyAmount,
    });

    const record: MarketRecord = {
      gameId: game.id,
      name: game.name,
      symbol: game.symbol,
      tokenAddress: result.tokenAddress,
      poolAddress: result.poolAddress,
      transactionHash: result.transactionHash,
      imageUri: result.imageUri,
      metadataUri: result.metadataUri,
      initialBuyMon: game.initialBuyMon,
      network: "testnet",
      createdAt: new Date().toISOString(),
    };

    markets.push(record);
    fs.writeFileSync(outPath, JSON.stringify(markets, null, 2));

    console.log("Token:", result.tokenAddress);
    console.log("Pool:", result.poolAddress);
    console.log("Tx:", result.transactionHash);
    console.log("Saved → data/markets.json");
  }

  const publicCopy = path.join(process.cwd(), "public", "tapmint", "markets.json");
  fs.mkdirSync(path.dirname(publicCopy), { recursive: true });
  fs.writeFileSync(publicCopy, JSON.stringify(markets, null, 2));
  console.log("\nDone. Markets:", markets.length);
  console.log("Synced → public/tapmint/markets.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
