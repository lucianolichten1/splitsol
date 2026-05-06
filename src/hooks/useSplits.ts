import { useCallback, useEffect, useMemo, useState } from "react";
import { storage } from "../lib/storage";
import { ParticipantConfirmationStatus, Split, SplitStatus } from "../types";

function deriveSplitStatus(split: Split): SplitStatus {
  const balances = Array.isArray(split.balances) ? split.balances : [];
  const confirmations = split.participantConfirmations ?? {};
  const confirmationValues = Object.values(confirmations);

  if (balances.length > 0 && balances.every((entry) => entry.settled)) {
    return "settled";
  }
  if (confirmationValues.some((v) => v === "disputed")) {
    return "disputed";
  }
  if (confirmationValues.some((v) => v === "pending")) {
    return "pending";
  }
  return "active";
}

function normalizeSplit(split: Split): Split {
  return {
    ...split,
    status: deriveSplitStatus(split),
  };
}

export function useSplits() {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storage.getSplits();
      const normalized = data.map(normalizeSplit);
      setSplits(normalized);
      return normalized;
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
    const normalized = normalizeSplit(split);
    const next = await storage.updateSplits((current) => [normalized, ...current]);
    setSplits(next.map(normalizeSplit));
  }, []);

  const updateSplit = useCallback(async (splitId: string, updater: (split: Split) => Split) => {
    const next = await storage.updateSplits((current) =>
      current.map((split) => (split.id === splitId ? normalizeSplit(updater(split)) : split))
    );
    setSplits(next.map(normalizeSplit));
  }, []);

  const markBalancePaidOnChain = useCallback(async (splitId: string, balanceId: string, txHash: string) => {
    const current = await storage.getSplits();
    const split = current.find((s) => s.id === splitId);
    if (!split) return false;

    const balances = Array.isArray(split.balances) ? split.balances : [];
    const target = balances.find((b) => b.id === balanceId);
    if (!target || target.settled) return false;

    const nextBalances = balances.map((entry) =>
      entry.id === balanceId ? { ...entry, settled: true, txHash } : entry
    );

    const updatedSplit = normalizeSplit({
      ...split,
      balances: nextBalances,
    });
    const next = current.map((s) => (s.id === splitId ? updatedSplit : s));
    await storage.setSplits(next);
    setSplits(next.map(normalizeSplit));
    return true;
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

    const updatedSplit = normalizeSplit({
      ...split,
      balances: nextBalances,
    });
    const next = current.map((s) => (s.id === splitId ? updatedSplit : s));
    await storage.setSplits(next);
    setSplits(next.map(normalizeSplit));
    return true;
  }, []);

  const setParticipantConfirmation = useCallback(
    async (splitId: string, participantId: string, status: ParticipantConfirmationStatus) => {
      const current = await storage.getSplits();
      const split = current.find((s) => s.id === splitId);
      if (!split) return false;

      const confirmations = {
        ...(split.participantConfirmations ?? {}),
        [participantId]: status,
      };

      const updatedSplit = normalizeSplit({
        ...split,
        participantConfirmations: confirmations,
      });
      const next = current.map((s) => (s.id === splitId ? updatedSplit : s));
      await storage.setSplits(next);
      setSplits(next.map(normalizeSplit));
      return true;
    },
    []
  );

  const activeSplits = useMemo(
    () => splits.filter((split) => split.status === "active" || split.status === "pending" || split.status === "disputed"),
    [splits]
  );
  const settledSplits = useMemo(() => splits.filter((split) => split.status === "settled"), [splits]);

  return {
    loading,
    splits,
    activeSplits,
    settledSplits,
    refresh,
    addSplit,
    updateSplit,
    markBalanceSettled,
    markBalancePaidOnChain,
    setParticipantConfirmation,
  };
}
