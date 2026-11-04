import { initSDK, parseEther } from "@nadfun/sdk";
import type { Address } from "viem";

export function getTreasurySdk() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  const rpcUrl = process.env.MONAD_TESTNET_RPC_URL || "https://testnet-rpc.monad.xyz";

  if (!privateKey?.startsWith("0x")) {
    throw new Error("PRIVATE_KEY not configured");
  }

  return initSDK({
    rpcUrl,
    privateKey,
    network: "testnet",
  });
}

export async function transferRewardToken(
  token: Address,
  to: Address,
  wholeTokens: string,
) {
  const sdk = getTreasurySdk();
  const amount = parseEther(wholeTokens);
  const hash = await sdk.transfer(token, to, amount);
  return { hash, amount: amount.toString(), from: sdk.account.address };
}
