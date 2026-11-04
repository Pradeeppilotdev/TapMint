import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { GAMES } from "@/lib/games";
import { addPoints, getPoints, POINTS_PER_TOKEN } from "@/lib/points-store";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  const account = getPoints(wallet);
  const unclaimed = account.points - account.claimedPoints;
  return NextResponse.json({
    ...account,
    unclaimed,
    pointsPerToken: POINTS_PER_TOKEN,
    claimableTokens: Math.floor(unclaimed / POINTS_PER_TOKEN),
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    wallet?: string;
    gameId?: string;
    score?: number;
  };

  const { wallet, gameId, score } = body;
  if (!wallet || !isAddress(wallet)) {
    return NextResponse.json({ error: "valid wallet required" }, { status: 400 });
  }
  if (!gameId || !GAMES.some((g) => g.id === gameId)) {
    return NextResponse.json({ error: "valid gameId required" }, { status: 400 });
  }
  if (typeof score !== "number" || score <= 0) {
    return NextResponse.json({ error: "positive score required" }, { status: 400 });
  }

  // MVP: 1 score point → 1 reward point (cap handled in store)
  const account = addPoints(wallet, score, gameId);
  const unclaimed = account.points - account.claimedPoints;

  return NextResponse.json({
    ok: true,
    ...account,
    unclaimed,
    pointsPerToken: POINTS_PER_TOKEN,
    claimableTokens: Math.floor(unclaimed / POINTS_PER_TOKEN),
  });
}
