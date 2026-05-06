import {
  SolanaMobileWalletAdapterError,
  SolanaMobileWalletAdapterErrorCode,
  SolanaMobileWalletAdapterProtocolError,
  SolanaMobileWalletAdapterProtocolErrorCode,
} from "@solana-mobile/mobile-wallet-adapter-protocol";

export function mapWalletConnectError(err: unknown): string {
  if (err instanceof SolanaMobileWalletAdapterProtocolError) {
    if (err.code === SolanaMobileWalletAdapterProtocolErrorCode.ERROR_AUTHORIZATION_FAILED) {
      return "Connection was cancelled or denied. You can try again anytime.";
    }
  }
  if (err instanceof SolanaMobileWalletAdapterError) {
    if (err.code === SolanaMobileWalletAdapterErrorCode.ERROR_WALLET_NOT_FOUND) {
      return "No Mobile Wallet Adapter wallet was found. Install a compatible wallet on this device and try again.";
    }
    if (err.code === SolanaMobileWalletAdapterErrorCode.ERROR_ASSOCIATION_CANCELLED) {
      return "Wallet connection was cancelled.";
    }
    return err.message;
  }
  if (err instanceof Error) {
    if (err.message.includes("only compatible with React Native Android")) {
      return "Wallet connect is only available on Android.";
    }
    return err.message;
  }
  return "Something went wrong connecting to the wallet. Please try again.";
}
