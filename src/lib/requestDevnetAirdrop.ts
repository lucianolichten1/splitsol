import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getDevnetConnection } from "./devnetConnection";

/** One devnet test airdrop = 1 SOL (lamports). */
export const DEVNET_TEST_AIRDROP_LAMPORTS = LAMPORTS_PER_SOL;

/** Minimum wait between airdrop attempts (client-side; reduces RPC / faucet spam). */
export const DEVNET_AIRDROP_COOLDOWN_MS = 3 * 60 * 1000;

export async function requestDevnetTestAirdrop(publicKey: PublicKey): Promise<void> {
  const connection = getDevnetConnection();
  const signature = await connection.requestAirdrop(publicKey, DEVNET_TEST_AIRDROP_LAMPORTS);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed"
  );
  if (confirmation.value.err) {
    throw new Error(`Devnet airdrop was not confirmed: ${JSON.stringify(confirmation.value.err)}`);
  }
}

export async function requestDevnetTestAirdropFromBase58(base58Address: string): Promise<void> {
  return requestDevnetTestAirdrop(new PublicKey(base58Address.trim()));
}

/** User-facing copy when the public faucet / RPC returns 429 or similar. */
export const DEVNET_AIRDROP_RATE_LIMIT_MESSAGE =
  "Devnet faucet is rate-limited. Wait a few minutes and try again.";

export function mapAirdropError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("retrying after") ||
    lower.includes("forbidden")
  ) {
    return DEVNET_AIRDROP_RATE_LIMIT_MESSAGE;
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "The network took too long to confirm. Check your connection or try again.";
  }
  if (lower.includes("invalid public key")) {
    return "Wallet address is not valid for Solana.";
  }
  if (lower.includes("airdrop") && (lower.includes("fail") || lower.includes("0x"))) {
    return "The devnet faucet could not fund this request. It may be out of SOL or limiting requests—try again later.";
  }
  return "Could not complete the devnet airdrop. The network may be busy—try again in a moment.";
}
