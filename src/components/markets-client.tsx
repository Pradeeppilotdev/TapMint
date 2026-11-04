"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { marketUrl, explorerUrl } from "../../public/tapmint/src/wallet-data.js";

type Linked = { game:{ id:string; title:string; tokenSymbol:string }; market:{ name:string; symbol:string; tokenAddress:string; transactionHash:string; network:string } | null };

export function MarketsClient() {
  const [linked, setLinked] = useState<Linked[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/markets", { signal:controller.signal }).then(async r => { if(!r.ok)throw new Error(); return r.json(); }).then(data => setLinked(data.linked ?? [])).catch(() => { if(!controller.signal.aborted)setError(true); });
    return () => controller.abort();
  }, []);
  return <main className="markets-page"><header className="markets-header"><Link className="auth-brand" href="/"><span aria-hidden="true">▷</span>tapmint</Link><Link href="/">Back to play ↗</Link></header><section className="markets-title"><span className="auth-eyebrow">MONAD TESTNET / THE COLLECTION</span><h1>A little proof of play.</h1><p>Meet the tokens behind your favourite games. Finish rounds to earn rewards, then find your wins in the wallet at the top right of the game feed.</p></section>{error && <p role="alert">Tokens could not be loaded. Please refresh to try again.</p>}{!error && !linked.length && <p role="status">Loading the collection…</p>}<div className="markets-grid">{linked.map(({ game, market }) => {
    const url=market && marketUrl(market.tokenAddress, market.network);
    const receipt=market && explorerUrl(market.transactionHash, market.network);
    return <article className="market-card" key={game.id}><span className="market-icon" aria-hidden="true">{game.tokenSymbol[0]}</span><h2>{market?.name || game.tokenSymbol}</h2><p>{game.title} · {game.tokenSymbol}</p>{market ? <><span className="market-address">{market.tokenAddress}</span>{url && <a className="market-link" href={url} target="_blank" rel="noopener noreferrer">Open on nad.fun ↗</a>}{receipt && <a className="market-receipt" href={receipt} target="_blank" rel="noopener noreferrer">View token creation ↗</a>}</> : <p>Token coming soon.</p>}</article>;
  })}</div><p className="markets-note">Testnet rewards have no cash value. Reward amounts depend on each game’s configured score threshold. nad.fun links open in a new tab.</p></main>;
}
