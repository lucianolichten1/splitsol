import type { Base64EncodedAddress } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { PublicKey } from "@solana/web3.js";
import { toUint8Array } from "js-base64";

export function base64MwAddressToBase58(address: Base64EncodedAddress): string {
  return new PublicKey(toUint8Array(address)).toBase58();
}
