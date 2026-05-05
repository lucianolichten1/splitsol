import * as Crypto from "expo-crypto";

/** UUID v4 for RN/Expo — avoids the `uuid` package’s Node `crypto` dependency. */
export function randomUuid(): string {
  return Crypto.randomUUID();
}
