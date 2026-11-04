"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getEmbeddedConnectedWallet,
  useCreateWallet,
  usePrivy,
  useWallets,
} from "@privy-io/react-auth";
import { createPublicClient, formatEther, http, type Address } from "viem";
import { monadTestnet } from "@/lib/chains";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

export function WalletPanel() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();

  const [creating, setCreating] = useState(false);
  const [createAttempted, setCreateAttempted] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [balanceMon, setBalanceMon] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Whitelabel email OTP does NOT trigger createOnLogin — create manually.
  const embedded = getEmbeddedConnectedWallet(wallets);
  const linkedWallet = user?.linkedAccounts?.find(
    (account) => account.type === "wallet" && account.walletClientType === "privy",
  );
  const address =
    embedded?.address ??
    (linkedWallet && "address" in linkedWallet ? (linkedWallet.address as string) : undefined);

  useEffect(() => {
    if (!ready || !authenticated || !walletsReady || address || creating || createAttempted) {
      return;
    }

    let cancelled = false;
    (async () => {
      setCreating(true);
      setCreateError(null);
      try {
        await createWallet();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create wallet";
        // Already exists is fine — wallets hook will pick it up.
        if (!/already|exists/i.test(message) && !cancelled) {
          setCreateError(message);
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
  }, [ready, authenticated, walletsReady, address, creating, createAttempted, createWallet]);

  const refreshBalance = useCallback(async (walletAddress: string) => {
    setBalanceLoading(true);
    try {
      const wei = await publicClient.getBalance({
        address: walletAddress as Address,
      });
      setBalanceMon(Number(formatEther(wei)).toFixed(4));
    } catch {
      setBalanceMon(null);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!address) {
      setBalanceMon(null);
      return;
    }
    void refreshBalance(address);
    const id = setInterval(() => void refreshBalance(address), 15_000);
    return () => clearInterval(id);
  }, [address, refreshBalance]);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!ready || !authenticated || !user) return null;

  const userEmail = user.email?.address;
  const walletStatus = address
    ? "ready"
    : creating || !walletsReady
      ? "creating"
      : createError
        ? "error"
        : "creating";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0c1110] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(61,207,142,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(45,120,90,0.18),_transparent_50%)]" />
      <div className="relative w-full max-w-md space-y-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-[#3dcf8e]">Signed in</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[#e8efe9]">Welcome</h1>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-[#c5d4c9]">
          <div>
            <p className="text-[#9aaba0]">Email</p>
            <p className="mt-1">{userEmail ?? "—"}</p>
          </div>

          <div>
            <p className="text-[#9aaba0]">Wallet</p>
            {walletStatus === "ready" && address ? (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="font-mono text-base text-[#e8efe9]" title={address}>
                  {shortenAddress(address)}
                </span>
                <button
                  type="button"
                  onClick={() => void copyAddress()}
                  className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-[#e8efe9] transition hover:border-[#3dcf8e]/50 hover:bg-white/5"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : walletStatus === "error" ? (
              <p className="mt-1 text-sm text-red-400">{createError}</p>
            ) : (
              <p className="mt-1 font-mono text-xs text-[#9aaba0]">Creating wallet…</p>
            )}
            {address ? (
              <p className="mt-1 break-all font-mono text-[10px] text-[#5f7168]">{address}</p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[#9aaba0]">MON balance</p>
              {address ? (
                <button
                  type="button"
                  onClick={() => void refreshBalance(address)}
                  className="text-[11px] text-[#3dcf8e] hover:underline"
                >
                  Refresh
                </button>
              ) : null}
            </div>
            <p className="mt-1 font-mono text-base text-[#e8efe9]">
              {!address
                ? "—"
                : balanceLoading && balanceMon === null
                  ? "…"
                  : `${balanceMon ?? "0.0000"} MON`}
            </p>
            <p className="mt-1 text-[11px] text-[#5f7168]">Monad Testnet</p>
          </div>
        </div>

        <a
          href="/markets"
          className="block w-full rounded-xl bg-[#3dcf8e] px-4 py-3 text-center text-sm font-medium text-[#0c1110] transition hover:bg-[#52d99c]"
        >
          Open markets & rewards
        </a>
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm text-[#e8efe9] transition hover:border-[#3dcf8e]/40 hover:bg-white/5"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
