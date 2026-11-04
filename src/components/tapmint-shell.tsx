"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getEmbeddedConnectedWallet, useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { EmailLogin } from "@/components/email-login";

const gameIds = new Set(["flap", "mole", "snake", "memory"]);

function ArcadeFrame({ frameRef }: { frameRef?: React.RefObject<HTMLIFrameElement | null> }) {
  const internalRef = useRef<HTMLIFrameElement>(null);
  const ref = frameRef ?? internalRef;
  useEffect(() => {
    const game = new URLSearchParams(window.location.search).get("game");
    if (game && gameIds.has(game) && ref.current) ref.current.src = `/tapmint/index.html?game=${game}`;
  }, [ref]);
  return <iframe ref={ref} title="TapMint game feed" src="/tapmint/index.html" className="arcade-frame" allow="clipboard-write" />;
}

export function TapmintShell() {
  // The local preview stays useful without credentials; production still requires Privy.
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return process.env.NODE_ENV === "development" ? <ArcadeFrame /> : <div className="auth-page"><div className="auth-card"><h1>One more game.</h1><p>Sign-in is temporarily unavailable. Please try again soon.</p></div></div>;
  }
  return <ConnectedArcade />;
}

function ConnectedArcade() {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const attempt = useRef(false);
  const [walletError, setWalletError] = useState("");
  const embedded = getEmbeddedConnectedWallet(wallets);
  const linked = user?.linkedAccounts.find(a => a.type === "wallet" && a.walletClientType === "privy");
  const wallet = embedded?.address ?? (linked && "address" in linked ? linked.address : undefined);

  const provisionWallet = useCallback(async () => {
    try { setWalletError(""); await createWallet(); }
    catch { setWalletError("We could not create your wallet. Please try again."); }
  }, [createWallet]);

  useEffect(() => {
    if (!authenticated) { attempt.current = false; return; }
    if (ready && walletsReady && !wallet && !attempt.current) {
      attempt.current = true;
      void provisionWallet();
    }
  }, [authenticated, ready, walletsReady, wallet, provisionWallet]);

  useEffect(() => {
    const send = (data: unknown) => iframeRef.current?.contentWindow?.postMessage(data, window.location.origin);
    const pushAuth = () => send({ type:"tapmint:auth", wallet: wallet ?? null });
    let disposed = false;
    async function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "tapmint:ready") pushAuth();
      if (data.type === "tapmint:game" && gameIds.has(data.gameId)) {
        const url = new URL(window.location.href); url.searchParams.set("game", data.gameId); window.history.replaceState(null, "", url);
      }
      if (data.type === "tapmint:logout") { await logout(); return; }
      if (!authenticated || !wallet) return;
      if (data.type === "tapmint:wallet-request") {
        try {
          const token = await getAccessToken();
          if (!token) throw new Error("Please sign in again to see your history.");
          const params = new URLSearchParams({ wallet });
          if (typeof data.cursor === "string") params.set("cursor", data.cursor);
          const response = await fetch(`/api/wallet/history?${params}`, { headers: { Authorization:`Bearer ${token}` }, cache:"no-store" });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || "History is temporarily unavailable.");
          if (!disposed) send({ type:"tapmint:wallet-data", requestId:data.requestId, payload, append:Boolean(data.cursor) });
        } catch (error) {
          if (!disposed) send({ type:"tapmint:wallet-data", requestId:data.requestId, error:error instanceof Error ? error.message : "Could not load your history." });
        }
      }
      if (data.type === "tapmint:score" && gameIds.has(data.gameId) && Number.isSafeInteger(data.score) && data.score >= 0 && data.score <= 100000) {
        try {
          const token = await getAccessToken();
          if (!token) throw new Error("Please sign in again to save your round.");
          const response = await fetch("/api/rewards/game-end", {
            method:"POST", headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
            body:JSON.stringify({ wallet, gameId:data.gameId, score:data.score, privyUserId:user?.id, email:user?.email?.address }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error("Your reward could not be sent. Check game history for its status.");
          if (!disposed) send({ type:"tapmint:reward-result", message:result.message || "Round saved." });
        } catch (error) {
          if (!disposed) send({ type:"tapmint:reward-result", message:error instanceof Error ? error.message : "Could not save your round." });
        }
      }
    }
    window.addEventListener("message", onMessage); pushAuth();
    return () => { disposed = true; window.removeEventListener("message", onMessage); };
  }, [authenticated, wallet, user?.id, user?.email?.address, getAccessToken, logout]);

  if (!ready) return <div className="auth-page"><p role="status">Getting your next game ready…</p></div>;
  if (!authenticated) return <EmailLogin />;
  if (!wallet) return <div className="auth-page"><div className="auth-card"><div className="auth-brand"><span>▷</span> tapmint</div><h1>Your wins belong here.</h1><p role="status">{walletError || "Creating your Privy wallet…"}</p>{walletError && <button className="primary-button" onClick={provisionWallet}>Try again</button>}<button className="text-button" onClick={() => logout()}>Sign out</button></div></div>;
  return <ArcadeFrame frameRef={iframeRef} />;
}
