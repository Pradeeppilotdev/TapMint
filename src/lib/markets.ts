import fs from "fs";
import path from "path";

export type MarketRecord = {
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

const MARKETS_PATH = path.join(process.cwd(), "data", "markets.json");

export function readMarkets(): MarketRecord[] {
  if (!fs.existsSync(MARKETS_PATH)) return [];
  return JSON.parse(fs.readFileSync(MARKETS_PATH, "utf8")) as MarketRecord[];
}

export function getMarketByGame(gameId: string) {
  return readMarkets().find((m) => m.gameId === gameId);
}

export function getMarketByToken(tokenAddress: string) {
  const lower = tokenAddress.toLowerCase();
  return readMarkets().find((m) => m.tokenAddress.toLowerCase() === lower);
}
