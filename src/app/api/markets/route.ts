import { NextResponse } from "next/server";
import { GAMES } from "@/lib/games";
import { readMarkets } from "@/lib/markets";

export async function GET() {
  const markets = readMarkets();
  const linked = GAMES.map((game) => ({
    game,
    market: markets.find((m) => m.gameId === game.id) ?? null,
  }));

  return NextResponse.json({
    network: "testnet",
    markets,
    linked,
  });
}
