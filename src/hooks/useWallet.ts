import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { MWA_APP_IDENTITY } from "../lib/mwaAppIdentity";
import { ONCHAIN_PAY_DISABLED_MESSAGE, ONCHAIN_PAYMENTS_ENABLED } from "../lib/solPaymentPolicy";
import { base64MwAddressToBase58 } from "../lib/solanaAddress";
import { LAMPORTS_PER_SOL, sendDevnetSolTransfer } from "../lib/sendDevnetSol";
import { mapSendSolError } from "../lib/sendSolPaymentErrors";
import { storage } from "../lib/storage";
import { mapWalletConnectError } from "../lib/walletConnectErrors";
import type { UserProfile } from "../types";

export type WalletProfileUpdater = (
  patch: Partial<Pick<UserProfile, "displayName" | "username" | "mockWalletAddress">>
) => Promise<UserProfile>;

export function useWallet(updateProfile: WalletProfileUpdater) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const clearWalletError = useCallback(() => setWalletError(null), []);

  const connect = useCallback(async (): Promise<boolean> => {
    setWalletError(null);
    if (Platform.OS !== "android") {
      setWalletError("Wallet connect is only available on Android.");
      return false;
    }
    setConnecting(true);
    try {
      const storedToken = await storage.getWalletAuthToken();
      await transact(async (wallet) => {
        const authorizationResult = await wallet.authorize({
          identity: MWA_APP_IDENTITY,
          chain: "devnet",
          auth_token: storedToken ?? undefined,
        });
        const first = authorizationResult.accounts[0];
        if (!first?.address) {
          throw new Error("The wallet did not return an account address.");
        }
        const base58 = base64MwAddressToBase58(first.address);
        await storage.setWalletAuthToken(authorizationResult.auth_token);
        await updateProfile({ mockWalletAddress: base58 });
      });
      return true;
    } catch (e) {
      setWalletError(mapWalletConnectError(e));
      return false;
    } finally {
      setConnecting(false);
    }
  }, [updateProfile]);

  const disconnect = useCallback(async () => {
    setWalletError(null);
    if (Platform.OS !== "android") {
      await storage.clearWalletAuthToken();
      await updateProfile({ mockWalletAddress: "" });
      return;
    }
    setDisconnecting(true);
    try {
      const token = await storage.getWalletAuthToken();
      if (token) {
        try {
          await transact(async (wallet) => {
            await wallet.deauthorize({ auth_token: token });
          });
        } catch {
          /* Local session should still clear if the wallet is unreachable. */
        }
      }
      await storage.clearWalletAuthToken();
      await updateProfile({ mockWalletAddress: "" });
    } finally {
      setDisconnecting(false);
    }
  }, [updateProfile]);

  const sendSolTransaction = useCallback(
    async (
      params: { toAddress: string; amountSol: number }
    ): Promise<{ ok: true; signature: string } | { ok: false; error: string }> => {
      if (Platform.OS !== "android") {
        return { ok: false, error: "Pay with Solana is only available on Android." };
      }
      if (!ONCHAIN_PAYMENTS_ENABLED) {
        return { ok: false, error: ONCHAIN_PAY_DISABLED_MESSAGE };
      }
      const lamports = Math.round(params.amountSol * LAMPORTS_PER_SOL);
      if (!Number.isFinite(lamports) || lamports < 1) {
        return { ok: false, error: "This amount is too small to send on-chain." };
      }
      try {
        const token = await storage.getWalletAuthToken();
        const signature = await sendDevnetSolTransfer({
          toAddressBase58: params.toAddress.trim(),
          lamports,
          authToken: token,
        });
        return { ok: true, signature };
      } catch (e) {
        return { ok: false, error: mapSendSolError(e) };
      }
    },
    []
  );

  return {
    connecting,
    disconnecting,
    walletError,
    clearWalletError,
    connect,
    disconnect,
    sendSolTransaction,
  };
}
