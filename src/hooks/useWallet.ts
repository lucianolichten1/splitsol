import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { MWA_APP_IDENTITY } from "../lib/mwaAppIdentity";
import { base64MwAddressToBase58 } from "../lib/solanaAddress";
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

  const connect = useCallback(async () => {
    setWalletError(null);
    if (Platform.OS !== "android") {
      setWalletError("Wallet connect is only available on Android.");
      return;
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
    } catch (e) {
      setWalletError(mapWalletConnectError(e));
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

  return {
    connecting,
    disconnecting,
    walletError,
    clearWalletError,
    connect,
    disconnect,
  };
}
