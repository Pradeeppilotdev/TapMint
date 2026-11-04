"use client";

import { FormEvent, useState } from "react";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";

type Step = "email" | "code";

/** Privy email OTP gate — required before TapMint play. */
export function EmailLogin() {
  const { ready } = usePrivy();
  const { sendCode, loginWithCode, state } = useLoginWithEmail();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isSending = pending || state.status === "sending-code";
  const isLoggingIn = pending || state.status === "submitting-code";

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await sendCode({ email: email.trim() });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await loginWithCode({ code: code.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E091C] text-[#A190FF]">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0E091C] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(110,84,255,0.28),_transparent_55%)]" />
      <div className="relative w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A190FF]">TapMint</p>
          <p className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-white">
            One more game.
          </p>
          <p className="text-sm text-[#DDD7FE]/75">
            Sign in with email to unlock play. Wallet required — rewards go on-chain.
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <label className="block space-y-2 text-left text-sm text-[#DDD7FE]">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-[#161225] px-4 py-3 text-white outline-none ring-[#6E54FF]/50 placeholder:text-white/30 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={isSending || !email.trim()}
              className="w-full rounded-xl bg-[#6E54FF] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7d66ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending code…" : "Continue to play"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-center text-sm text-[#DDD7FE]/75">
              Code sent to <span className="text-white">{email}</span>
            </p>
            <label className="block space-y-2 text-left text-sm text-[#DDD7FE]">
              One-time code
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full rounded-xl border border-white/10 bg-[#161225] px-4 py-3 tracking-[0.3em] text-white outline-none ring-[#6E54FF]/50 placeholder:text-white/30 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={isLoggingIn || !code.trim()}
              className="w-full rounded-xl bg-[#6E54FF] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#7d66ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingIn ? "Verifying…" : "Verify & play"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full text-sm text-[#A190FF] transition hover:text-white"
            >
              Use a different email
            </button>
          </form>
        )}

        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
