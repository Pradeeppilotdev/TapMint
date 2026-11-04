"use client";

import Link from "next/link";
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

  if (!ready) return <div className="auth-page"><p role="status">Getting your next game ready…</p></div>;

  return <main className="auth-page">
    <Link className="auth-brand" href="/" aria-label="TapMint home"><span aria-hidden="true">▷</span>tapmint</Link>
    <section className="auth-card">
      <span className="auth-eyebrow">SMALL GAMES. LITTLE VICTORIES.</span>
      <h1>One more<br />game.</h1>
      <p>A little play break, with something to show for it.<br />Sign in to play and collect your rewards.</p>
      {step === "email" ? <form onSubmit={handleSendCode}>
        <label htmlFor="email">Your email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" disabled={isSending} />
        <button className="primary-button" type="submit" disabled={isSending || !email.trim()}>{isSending ? "Sending code…" : "Let’s play ↗"}</button>
      </form> : <form onSubmit={handleVerifyCode}>
        <p className="code-sent">Code sent to <strong>{email}</strong></p>
        <label htmlFor="code">One-time code</label>
        <input id="code" type="text" required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" disabled={isLoggingIn} />
        <button className="primary-button" type="submit" disabled={isLoggingIn || !code.trim()}>{isLoggingIn ? "Verifying…" : "Verify & play ↗"}</button>
        <button className="text-button" type="button" disabled={pending} onClick={() => { setStep("email"); setCode(""); setError(null); }}>Use a different email</button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="auth-footnote"><span>◇</span> Your wallet is created with Privy.<br />No extension needed. Rewards on Monad testnet.</div>
    </section>
    <p className="auth-slogan">PLAY. COLLECT. REPEAT.</p>
  </main>;
}
