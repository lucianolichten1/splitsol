import { Split } from "../types";

export type GroupSplitStats = {
  activeSplitsCount: number;
  latestSplitName: string | null;
};

export function getGroupSplitStatsMap(groups: { id: string }[], splits: Split[]): Map<string, GroupSplitStats> {
  const map = new Map<string, GroupSplitStats>();
  for (const g of groups) {
    const groupSplits = splits.filter((s) => s.groupId === g.id);
    const activeSplitsCount = groupSplits.filter((s) => s.status !== "settled").length;
    const sorted = [...groupSplits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const latestSplitName = sorted[0]?.name ?? null;
    map.set(g.id, { activeSplitsCount, latestSplitName });
  }
  return map;
}
