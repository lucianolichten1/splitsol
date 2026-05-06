/**
 * On-chain settlement is disabled until USD can be converted for crypto transfer.
 * balance.amount is always USD; do not treat it as an on-chain token amount.
 */
export const ONCHAIN_PAYMENTS_ENABLED = false;

/** Alias for readability at call sites. */
export const CAN_PAY_ONCHAIN = ONCHAIN_PAYMENTS_ENABLED;

/** @deprecated Use ONCHAIN_PAYMENTS_ENABLED */
export const USD_TO_SOL_ONCHAIN_PAYMENT_ENABLED = ONCHAIN_PAYMENTS_ENABLED;

export const ONCHAIN_PAY_DISABLED_MESSAGE =
  "On-chain payment needs a US-dollar-to-crypto conversion step before it can be enabled.";

/** @deprecated Use ONCHAIN_PAY_DISABLED_MESSAGE */
export const PAY_SOL_USD_CONVERSION_MESSAGE = ONCHAIN_PAY_DISABLED_MESSAGE;

/** Shown with disabled Pay via Solana until conversion exists. */
export function payViaSolDisabledSubtext(): string {
  return ONCHAIN_PAY_DISABLED_MESSAGE;
}

/** Label for the disabled on-chain payment control (avoid crypto tickers next to USD balances). */
export const PAY_ONCHAIN_BUTTON_LABEL = "Pay on-chain";
