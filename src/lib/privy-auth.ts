import { importSPKI, jwtVerify } from "jose";

export class WalletAuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Verify the signed identity before accessing private round history. */
export async function authenticatedPlayer(request: Request) {
  const bearer = request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) throw new WalletAuthError("Please sign in to see your history.", 401);
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const publicKey = process.env.PRIVY_VERIFICATION_KEY;
  if (!appId || !publicKey) throw new WalletAuthError("Wallet history is not configured yet. Please try again later.", 503);
  try {
    const key = await importSPKI(publicKey.replace(/\\n/g, "\n"), "ES256");
    const { payload } = await jwtVerify(bearer.slice(7), key, {
      algorithms:["ES256"], issuer:"privy.io", audience:appId,
      requiredClaims:["sub", "exp", "iat"],
    });
    if (typeof payload.sub !== "string" || !payload.sub.startsWith("did:privy:")) throw new Error("Invalid subject");
    return payload.sub;
  } catch {
    throw new WalletAuthError("Your session expired. Please sign in again.", 401);
  }
}
