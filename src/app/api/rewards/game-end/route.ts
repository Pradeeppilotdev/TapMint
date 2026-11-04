import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { GAMES } from "@/lib/games";
import { settleGameEnd, type GameEndInput } from "@/lib/rewards";
import type { GameId } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      wallet?: string;
      gameId?: string;
      score?: number;
      privyUserId?: string;
      email?: string;
    };

    const { wallet, gameId, score, privyUserId, email } = body;

    if (!wallet || !isAddress(wallet)) {
      return NextResponse.json({ error: "valid wallet required" }, { status: 400 });
    }
    if (!gameId || !GAMES.some((g) => g.id === gameId)) {
      return NextResponse.json({ error: "valid gameId required" }, { status: 400 });
    }
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100_000) {
      return NextResponse.json({ error: "invalid score" }, { status: 400 });
    }

    const result = await settleGameEnd({
      wallet,
      gameId: gameId as GameId,
      score: Math.floor(score),
      privyUserId: privyUserId || null,
      email: email || null,
    } satisfies GameEndInput);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "game-end failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
