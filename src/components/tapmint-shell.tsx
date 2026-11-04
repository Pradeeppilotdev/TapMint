"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getEmbeddedConnectedWallet,
  useCreateWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { EmailLogin } from "@/components/email-login";

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * TapMint is the main product. No guest / direct play —
 * Privy email + embedded wallet required before the feed loads.
 */
export function TapmintShell() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [creating, setCreating] = useState(false);
  const [createAttempted, setCreateAttempted] = useState(false);

  const embedded = getEmbeddedConnectedWallet(wallets);
  const linked = user?.linkedAccounts?.find(
    (a) => a.type === "wallet" && a.walletClientType === "privy",
  );
  const wallet =
    embedded?.address ??
    (linked && "address" in linked ? String(linked.address) : undefined);

  useEffect(() => {
    if (!ready || !authenticated || !walletsReady || wallet || creating || createAttempted) {
      return;
    }
    let cancelled = false;
    (async () => {
      setCreating(true);
      try {
        await createWallet();
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!/already|exists/i.test(message) && !cancelled) {
          console.error(message);
        }
      } finally {
        if (!cancelled) {
          setCreating(false);
          setCreateAttempted(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, walletsReady, wallet, creating, createAttempted, createWallet]);

  const pushAuth = useCallback(() => {
    if (!wallet || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "tapmint:auth",
        wallet,
        privyUserId: user?.id ?? null,
        email: user?.email?.address ?? null,
      },
      "*",
    );
  }, [wallet, user?.id, user?.email?.address]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (typeof window !== "undefined" && event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === "tapmint:ready") pushAuth();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pushAuth]);

  useEffect(() => {
    pushAuth();
  }, [pushAuth]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E091C] text-[#DDD7FE]">
        Loading…
      </div>
    );
  }

  // Hard gate: no guest, no direct play
  if (!authenticated) {
    return <EmailLogin />;
  }

  if (!wallet) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0E091C] px-6 text-center text-[#DDD7FE]">
        <p className="font-[family-name:var(--font-display)] text-3xl">Creating your wallet…</p>
        <p className="max-w-sm text-sm text-[#A190FF]">
          TapMint is wallet-gated so scores can earn on-chain rewards. This only takes a moment.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-[#DDD7FE]/70 underline"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-[#0E091C]">
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0E091C]/92 px-3 py-2 text-xs text-[#DDD7FE] backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-semibold tracking-wide">tapmint</span>
          <span className="truncate font-mono text-[#A190FF]">{shorten(wallet)}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/markets"
            className="rounded-full bg-[#6E54FF] px-3 py-1.5 font-medium text-white"
          >
            Tokens
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full border border-white/20 px-3 py-1.5"
          >
            Log out
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="TapMint"
        src="/tapmint/index.html"
        className="h-full w-full border-0 pt-10"
        allow="clipboard-write"
      />
    </div>
  );
}
