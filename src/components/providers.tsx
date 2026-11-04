"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { monad, monadTestnet } from "@/lib/chains";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c1110] px-6 text-center text-[#e8efe9]">
        <div className="max-w-md space-y-3">
          <p className="text-lg font-medium">Missing Privy App ID</p>
          <p className="text-sm text-[#9aaba0]">
            Add <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_PRIVY_APP_ID</code>{" "}
            to <code className="rounded bg-white/10 px-1.5 py-0.5">.env.local</code>, then restart
            the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "dark",
          accentColor: "#3dcf8e",
          logo: undefined,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet, monad],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
