export function truncateWalletAddress(addr: string): string {
  const t = addr.trim();
  if (t.length <= 14) return t;
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
}
