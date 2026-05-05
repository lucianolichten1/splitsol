import { useCallback, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { Split, SplitStatus } from "../types";

export function useSplits() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storage.getSplits();
      setSplits(data);
      return data;
    } catch {
      setSplits([]);
      return [];
    } finally {
      setLoading(false);
    }
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

  const markBalanceSettled = useCallback(async (splitId: string, balanceId: string) => {
    const current = await storage.getSplits();
    const split = current.find((s) => s.id === splitId);
    if (!split) return false;
    const balances = Array.isArray(split.balances) ? split.balances : [];
    const target = balances.find((b) => b.id === balanceId);
    if (!target || target.settled) return false;

    const nextBalances = balances.map((entry) =>
      entry.id === balanceId ? { ...entry, settled: true } : entry
    );
    const status: SplitStatus = nextBalances.every((entry) => entry.settled) ? "settled" : "active";
    const updatedSplit = { ...split, balances: nextBalances, status };
    const next = current.map((s) => (s.id === splitId ? updatedSplit : s));
    await storage.setSplits(next);
    setSplits(next);
    return true;
  }, []);

  const activeSplits = useMemo(
    () => splits.filter((split) => split.status === "active"),
    [splits]
  );
  const settledSplits = useMemo(
    () => splits.filter((split) => split.status === "settled"),
    [splits]
  );

  return {
    loading,
    splits,
    activeSplits,
    settledSplits,
    refresh,
    addSplit,
    updateSplit,
    markBalanceSettled,
  };
}
