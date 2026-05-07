/**
 * Format plain numeric amounts as SOL strings for demo display.
 * Examples: 0.01 => "0.01 SOL", 0.005 => "0.005 SOL", 1 => "1 SOL"
 */
export function formatSolAmount(amount: number): string {
  if (!Number.isFinite(amount)) return "0 SOL";
  const rounded = Math.round(amount * 1_000_000) / 1_000_000;
  const normalized = rounded.toFixed(6).replace(/\.?0+$/, "");
  return `${normalized || "0"} SOL`;
}
