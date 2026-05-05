import { useCallback, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { BalanceEntry, Split } from "../types";

export function useSplits() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await storage.getSplits();
    setSplits(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addSplit = useCallback(async (split: Split) => {
    const next = await storage.updateSplits((current) => [split, ...current]);
    setSplits(next);
  }, []);

  const updateSplit = useCallback(async (splitId: string, updater: (split: Split) => Split) => {
    const next = await storage.updateSplits((current) =>
      current.map((split) => (split.id === splitId ? updater(split) : split))
    );
    setSplits(next);
  }, []);

  const markBalanceSettled = useCallback(
    async (splitId: string, balanceId: string) => {
      await updateSplit(splitId, (split) => {
        const balances = split.balances.map((entry) =>
          entry.id === balanceId ? { ...entry, settled: true } : entry
        );
        const status = balances.every((entry) => entry.settled) ? "settled" : "active";
        return { ...split, balances, status };
      });
    },
    [updateSplit]
  );

  const activeSplits = useMemo(
    () => splits.filter((split) => split.status === "active"),
    [splits]
  );
  const settledSplits = useMemo(
    () => splits.filter((split) => split.status === "settled"),
    [splits]
  );

  const outstandingTotal = useMemo(
    () =>
      splits.reduce((acc, split) => {
        const remaining = split.balances
          .filter((b: BalanceEntry) => !b.settled)
          .reduce((sum, b) => sum + b.amount, 0);
        return acc + remaining;
      }, 0),
    [splits]
  );

  return {
    loading,
    splits,
    activeSplits,
    settledSplits,
    outstandingTotal,
    refresh,
    addSplit,
    updateSplit,
    markBalanceSettled,
  };
}
