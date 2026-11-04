import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { authenticatedPlayer, WalletAuthError } from "@/lib/privy-auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { readMarkets } from "@/lib/markets";
import { parseCursor, readWalletHistory } from "@/lib/wallet-history";

export async function GET(request: NextRequest) {
  const headers = { "Cache-Control":"private, no-store", Vary:"Authorization" };
  try {
    const userId = await authenticatedPlayer(request);
    const wallet = request.nextUrl.searchParams.get("wallet") ?? "";
    if (!isAddress(wallet)) return NextResponse.json({ error:"A valid wallet is required." }, { status:400, headers });
    let offset: number;
    try { offset = parseCursor(request.nextUrl.searchParams.get("cursor")); }
    catch { return NextResponse.json({ error:"Invalid history page." }, { status:400, headers }); }
    const result = await readWalletHistory(getSupabaseAdmin(), userId, wallet, readMarkets(), offset);
    return NextResponse.json(result, { headers });
  } catch (error) {
    const status = error instanceof WalletAuthError ? error.status : 503;
    return NextResponse.json({ error:error instanceof WalletAuthError ? error.message : "Wallet history is temporarily unavailable. Please try again." }, { status, headers });
  }
}
