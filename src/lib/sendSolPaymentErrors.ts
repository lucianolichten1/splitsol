import {
  SolanaMobileWalletAdapterError,
  SolanaMobileWalletAdapterErrorCode,
  SolanaMobileWalletAdapterProtocolError,
  SolanaMobileWalletAdapterProtocolErrorCode,
} from "@solana-mobile/mobile-wallet-adapter-protocol";
import { mapWalletConnectError } from "./walletConnectErrors";

export function mapSendSolError(err: unknown): string {
  if (err instanceof SolanaMobileWalletAdapterProtocolError) {
    if (err.code === SolanaMobileWalletAdapterProtocolErrorCode.ERROR_AUTHORIZATION_FAILED) {
      return "Payment was cancelled or denied in the wallet.";
    }
    if (err.code === SolanaMobileWalletAdapterProtocolErrorCode.ERROR_NOT_SIGNED) {
      return "The wallet did not sign this transaction.";
    }
    if (err.code === SolanaMobileWalletAdapterProtocolErrorCode.ERROR_NOT_SUBMITTED) {
      return "The transaction could not be submitted. Try again.";
    }
  }
  if (err instanceof SolanaMobileWalletAdapterError) {
    return mapWalletConnectError(err);
  }

  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (raw === "INVALID_LAMPORTS") {
    return "This amount is too small to send on-chain.";
  }
  if (raw === "NO_AUTHORIZED_ACCOUNT") {
    return "No wallet account is authorized. Connect your wallet and try again.";
  }
  if (raw === "NO_SIGNATURE") {
    return "The wallet did not return a transaction signature.";
  }

  if (lower.includes("invalid public key") || lower.includes("invalidpublickey")) {
    return "Recipient address is not a valid Solana address.";
  }
  if (
    lower.includes("insufficient") ||
    lower.includes("insufficientfunds") ||
    lower.includes("custom program error: 0x1") ||
    lower.includes("0x1")
  ) {
    return "Not enough SOL in your wallet for this payment (including fees).";
  }
  if (lower.includes("user rejected") || lower.includes("rejected")) {
    return "Payment was cancelled in the wallet.";
  }
  if (lower.includes("blockhash not found") || lower.includes("expired")) {
    return "The network was too slow to confirm. Try again.";
  }
  if (lower.includes("simulation failed")) {
    return "The transaction could not be simulated (often insufficient SOL or invalid transfer).";
  }
  if (lower.includes("429") || lower.includes("rate limit")) {
    return "Devnet RPC is busy. Wait a moment and try again.";
  }

  if (err instanceof Error && err.message.startsWith("CONFIRM_FAILED")) {
    return "Payment did not confirm on devnet. Your balance may be unchanged—check the explorer before retrying.";
  }

  return mapWalletConnectError(err);
}
