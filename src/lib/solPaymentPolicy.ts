/** Hackathon demo mode: app transaction amounts are SOL and can be paid on-chain directly. */
export const ONCHAIN_PAYMENTS_ENABLED = true;

/** Alias for readability at call sites. */
export const CAN_PAY_ONCHAIN = ONCHAIN_PAYMENTS_ENABLED;

export const PAY_ONCHAIN_BUTTON_LABEL = "Pay on-chain";

export function payViaSolDisabledSubtext(
  walletConnected: boolean,
  recipientHasWallet: boolean
): string {
  if (!walletConnected) return "Connect wallet to pay on-chain.";
  if (!recipientHasWallet) return "Recipient needs a wallet address on this transaction.";
  return "On-chain payment is unavailable.";
}
