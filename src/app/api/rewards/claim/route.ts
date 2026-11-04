import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { getMarketByGame } from "@/lib/markets";
import { getPoints, markClaimed, POINTS_PER_TOKEN } from "@/lib/points-store";
import { transferRewardToken } from "@/lib/treasury";

/**
 * Convert unclaimed points → game meme tokens from treasury.
 * Body: { wallet, gameId }
 * Rate: POINTS_PER_TOKEN points = 1 whole token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { wallet?: string; gameId?: string };
    const { wallet, gameId } = body;

    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: "valid wallet required" }, { status: 400 });
    }
    if (!gameId) {
      return NextResponse.json({ error: "gameId required" }, { status: 400 });
    }

    const market = getMarketByGame(gameId);
    if (!market) {
      return NextResponse.json(
        { error: "market not created for this game yet" },
        { status: 404 },
      );
    }

    const account = getPoints(wallet);
    const unclaimed = account.points - account.claimedPoints;
    const tokens = Math.floor(unclaimed / POINTS_PER_TOKEN);

    if (tokens < 1) {
      return NextResponse.json(
        {
          error: "not enough points",
          unclaimed,
          need: POINTS_PER_TOKEN,
        },
        { status: 400 },
      );
    }

    const pointsUsed = tokens * POINTS_PER_TOKEN;
    const whole = String(tokens);

    const { hash, from } = await transferRewardToken(
      market.tokenAddress as Address,
      wallet as Address,
      whole,
    );

    const updated = markClaimed(wallet, pointsUsed);

    return NextResponse.json({
      ok: true,
      gameId,
      symbol: market.symbol,
      tokenAddress: market.tokenAddress,
      tokensSent: whole,
      pointsUsed,
      txHash: hash,
      treasury: from,
      account: updated,
      explorer: `https://testnet.monadvision.com/tx/${hash}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "claim failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
