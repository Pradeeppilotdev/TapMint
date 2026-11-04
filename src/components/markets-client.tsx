"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type Market = {
  gameId: string;
  name: string;
  symbol: string;
  tokenAddress: string;
  imageUri: string;
  initialBuyMon: string;
  transactionHash: string;
};

type Linked = {
  game: { id: string; title: string; tokenSymbol: string; accent: string };
  market: Market | null;
};

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Info only — no buy/claim. Payouts happen automatically on game end. */
export function MarketsClient() {
  const { ready, authenticated } = usePrivy();
  const [linked, setLinked] = useState<Linked[]>([]);
  const scorePerToken = process.env.NEXT_PUBLIC_REWARD_SCORE_PER_TOKEN || "10";

  useEffect(() => {
    void fetch("/api/markets")
      .then((r) => r.json())
      .then((data) => setLinked(data.linked ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-[#0E091C] px-4 py-10 text-[#DDD7FE]">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#A190FF]">Monad testnet</p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-white">
              Reward tokens
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#DDD7FE]/70">
              No buy or claim. Finish a TapMint round → treasury sends tokens straight to your
              Privy wallet. Ratio:{" "}
              <strong className="text-white">{scorePerToken} score = 1 token</strong>.
            </p>
          </div>
          <Link href="/" className="text-sm text-[#A190FF] hover:underline">
            ← TapMint play
          </Link>
        </div>

        {!ready ? (
          <p className="text-[#A190FF]">Loading…</p>
        ) : !authenticated ? (
          <p className="text-sm text-amber-300">Sign in on the home page to play and receive rewards.</p>
        ) : null}

        <div className="space-y-4">
          {linked.map(({ game, market }) => (
            <div
              key={game.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center"
            >
              {market?.imageUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={market.imageUri}
                  alt={game.tokenSymbol}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-xs font-bold text-[#0E091C]"
                  style={{ background: game.accent }}
                >
                  {game.tokenSymbol}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">
                  {game.title} · ${game.tokenSymbol}
                </p>
                {market ? (
                  <>
                    <p className="mt-1 break-all font-mono text-xs text-[#A190FF]">
                      {market.tokenAddress}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Treasury seed: {market.initialBuyMon} MON ·{" "}
                      <a
                        className="text-[#A190FF] hover:underline"
                        href={`https://testnet.monadvision.com/tx/${market.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        create tx {shorten(market.transactionHash)}
                      </a>
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-400">Market missing</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
