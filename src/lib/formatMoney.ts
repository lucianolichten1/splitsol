/**
 * Format plain numeric amounts as USD for display (app treats stored amounts as USD).
 */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "$0.00";
  return `$${amount.toFixed(2)}`;
}
