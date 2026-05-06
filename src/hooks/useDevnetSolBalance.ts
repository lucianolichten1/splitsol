import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getDevnetConnection } from "../lib/devnetConnection";
import { lamportsToSol } from "../lib/lamportsToSol";

function mapBalanceError(err: unknown): string {
  if (err instanceof Error) {
    if (/invalid public key/i.test(err.message)) {
      return "Wallet address is not valid for Solana.";
    }
    return err.message;
  }
  return "Could not load devnet balance. Check your connection and try again.";
}

export function useDevnetSolBalance(walletAddressBase58: string | null | undefined) {
  const trimmed = walletAddressBase58?.trim() ?? "";

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!trimmed) {
      setSolBalance(null);
      setError(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    setError(null);
    try {
      const lamports = await getDevnetConnection().getBalance(new PublicKey(trimmed));
      setSolBalance(lamportsToSol(lamports));
    } catch (e) {
      setSolBalance(null);
      setError(mapBalanceError(e));
    } finally {
      setRefreshing(false);
    }
  }, [trimmed]);

  useEffect(() => {
    if (!trimmed) {
      setSolBalance(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const lamports = await getDevnetConnection().getBalance(new PublicKey(trimmed));
        if (!cancelled) {
          setSolBalance(lamportsToSol(lamports));
        }
      } catch (e) {
        if (!cancelled) {
          setSolBalance(null);
          setError(mapBalanceError(e));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  return {
    solBalance,
    loading,
    refreshing,
    error,
    refresh,
  };
}
