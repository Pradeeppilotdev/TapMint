import { getMarketByGame } from "@/lib/markets";
import { getSupabaseAdmin, type GameId } from "@/lib/supabase";
import { transferRewardToken } from "@/lib/treasury";
import type { Address } from "viem";

const DEFAULT_SCORE_PER_TOKEN = Number(process.env.REWARD_SCORE_PER_TOKEN || "10");

export type GameEndInput = {
  wallet: string;
  gameId: GameId;
  score: number;
  privyUserId?: string | null;
  email?: string | null;
};

/** Every `scorePerToken` score points → 1 whole meme token (floor). */
export function tokensForScore(score: number, scorePerToken: number) {
  if (scorePerToken <= 0) return 0;
  return Math.floor(Math.max(0, score) / scorePerToken);
}

export async function resolveScorePerToken(gameId: GameId) {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from("reward_ratios")
      .select("score_per_token")
      .eq("game_id", gameId)
      .maybeSingle();
    if (data?.score_per_token) return Number(data.score_per_token);
  } catch {
    // env default if table missing / supabase down
  }
  return DEFAULT_SCORE_PER_TOKEN;
}

async function upsertPlayer(input: {
  wallet: string;
  privyUserId?: string | null;
  email?: string | null;
}) {
  const sb = getSupabaseAdmin();
  const wallet = input.wallet.toLowerCase();

  const { data, error } = await sb
    .from("players")
    .upsert(
      {
        wallet,
        privy_user_id: input.privyUserId || null,
        email: input.email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "wallet" },
    )
    .select("id")
    .single();

  if (error) throw new Error(`player upsert: ${error.message}`);
  return data.id as string;
}

export async function settleGameEnd(input: GameEndInput) {
  const wallet = input.wallet.toLowerCase();
  const { gameId, score, privyUserId, email } = input;
  const market = getMarketByGame(gameId);
  if (!market) throw new Error(`No market for game ${gameId}`);

  const scorePerToken = await resolveScorePerToken(gameId);
  const tokens = tokensForScore(score, scorePerToken);
  const sb = getSupabaseAdmin();
  const playerId = await upsertPlayer({ wallet, privyUserId, email });

  if (tokens < 1) {
    const { data: round, error } = await sb
      .from("game_rounds")
      .insert({
        player_id: playerId,
        privy_user_id: privyUserId || null,
        wallet,
        game_id: gameId,
        score,
        score_per_token: scorePerToken,
        tokens_amount: 0,
        token_symbol: market.symbol,
        token_address: market.tokenAddress,
        network: "testnet",
        status: "skipped",
        error: `Need ${scorePerToken} score for 1 token (got ${score})`,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return {
      paid: false,
      tokens: 0,
      scorePerToken,
      round,
      reason: "below_threshold",
      message: `Score ${score} — need ${scorePerToken} pts per token`,
    };
  }

  const { data: pending, error: insertErr } = await sb
    .from("game_rounds")
    .insert({
      player_id: playerId,
      privy_user_id: privyUserId || null,
      wallet,
      game_id: gameId,
      score,
      score_per_token: scorePerToken,
      tokens_amount: tokens,
      token_symbol: market.symbol,
      token_address: market.tokenAddress,
      network: "testnet",
      status: "recorded",
    })
    .select("*")
    .single();

  if (insertErr || !pending) {
    throw new Error(insertErr?.message || "failed to record round");
  }

  try {
    const { hash } = await transferRewardToken(
      market.tokenAddress as Address,
      wallet as Address,
      String(tokens),
    );

    const { data: paid, error: updateErr } = await sb
      .from("game_rounds")
      .update({ status: "paid", tx_hash: hash })
      .eq("id", pending.id)
      .select("*")
      .single();

    if (updateErr) throw new Error(updateErr.message);

    return {
      paid: true,
      tokens,
      scorePerToken,
      txHash: hash,
      symbol: market.symbol,
      tokenAddress: market.tokenAddress,
      round: paid,
      explorer: `https://testnet.monadvision.com/tx/${hash}`,
      message: `Sent ${tokens} $${market.symbol} for score ${score}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "transfer failed";
    await sb
      .from("game_rounds")
      .update({ status: "failed", error: message })
      .eq("id", pending.id);
    throw new Error(message);
  }
}
