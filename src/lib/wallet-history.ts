import type { SupabaseClient } from "@supabase/supabase-js";
import type { MarketRecord } from "./markets";

export const HISTORY_PAGE_SIZE = 20;
const HISTORY_FIELDS = "id,game_id,score,score_per_token,tokens_amount,token_symbol,token_address,network,tx_hash,status,created_at";

type Round = { id:string; game_id:string; score:number; score_per_token:number; tokens_amount:string; token_symbol:string; token_address:string; network:string; tx_hash:string | null; status:string; created_at:string };

export function parseCursor(value: string | null) {
  if (!value) return 0;
  if (!/^\d{1,8}$/.test(value)) throw new Error("Invalid history page.");
  const offset = Number(value);
  if (offset % HISTORY_PAGE_SIZE !== 0) throw new Error("Invalid history page.");
  return offset;
}

export async function readWalletHistory(sb: SupabaseClient, userId: string, wallet: string, markets: MarketRecord[], offset = 0) {
  // Both predicates are mandatory: caller-supplied wallet addresses cannot expose another player's rounds.
  const scope = () => sb.from("game_rounds").select(HISTORY_FIELDS, { count:"exact" }).eq("privy_user_id", userId).eq("wallet", wallet.toLowerCase());
  const { data, count, error } = await scope().order("created_at", { ascending:false }).order("id", { ascending:false }).range(offset, offset + HISTORY_PAGE_SIZE - 1);
  if (error) throw new Error("Game history is temporarily unavailable. Please try again.");
  const totals = new Map<string, bigint>();
  // Page through all paid records; never present a truncated page as an all-time total.
  // The current reward service pays whole tokens only.
  for (let start = 0; ; start += 500) {
    const result = await sb.from("game_rounds").select("token_address,network,tokens_amount")
      .eq("privy_user_id", userId).eq("wallet", wallet.toLowerCase()).eq("status", "paid")
      .order("id", { ascending:true }).range(start, start + 499);
    if (result.error) throw new Error("Token totals are temporarily unavailable. Please try again.");
    for (const row of result.data || []) {
      const amount = String(row.tokens_amount);
      if (!/^\d+(?:\.0+)?$/.test(amount)) throw new Error("Token totals could not be read accurately.");
      const key = `${row.network}:${String(row.token_address).toLowerCase()}`;
      totals.set(key, (totals.get(key) ?? BigInt(0)) + BigInt(amount.split(".")[0]));
    }
    if ((result.data?.length ?? 0) < 500) break;
  }
  return {
    totalRounds:count ?? 0,
    rounds:(data ?? []) as Round[],
    nextCursor:offset + HISTORY_PAGE_SIZE < (count ?? 0) ? String(offset + HISTORY_PAGE_SIZE) : null,
    tokens:markets.map(market => ({
      gameId:market.gameId, name:market.name, symbol:market.symbol,
      tokenAddress:market.tokenAddress, network:market.network,
      earned:(totals.get(`${market.network}:${market.tokenAddress.toLowerCase()}`) ?? BigInt(0)).toString(),
    })),
  };
}
