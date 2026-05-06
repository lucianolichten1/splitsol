import AsyncStorage from "@react-native-async-storage/async-storage";
import { createDefaultUserProfile } from "./defaultProfile";
import { Friend, Group, Split, UserProfile } from "../types";

const KEYS = {
  splits: "splitsol:splits",
  groups: "splitsol:groups",
  profile: "splitsol:profile",
  friends: "splitsol:friends",
  /** MWA auth token for silent re-authorize; local only */
  walletAuthToken: "splitsol:walletAuthToken",
} as const;

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function updateJSON<T>(
  key: string,
  fallback: T,
  updater: (current: T) => T
): Promise<T> {
  const current = await getJSON<T>(key, fallback);
  const next = updater(current);
  await setJSON(key, next);
  return next;
}

export const storage = {
  keys: KEYS,
  getSplits: () => getJSON<Split[]>(KEYS.splits, []),
  setSplits: (splits: Split[]) => setJSON(KEYS.splits, splits),
  updateSplits: (updater: (splits: Split[]) => Split[]) =>
    updateJSON<Split[]>(KEYS.splits, [], updater),
  getGroups: () => getJSON<Group[]>(KEYS.groups, []),
  setGroups: (groups: Group[]) => setJSON(KEYS.groups, groups),
  updateGroups: (updater: (groups: Group[]) => Group[]) =>
    updateJSON<Group[]>(KEYS.groups, [], updater),

  getProfile: () => getJSON<UserProfile | null>(KEYS.profile, null),
  setProfile: (profile: UserProfile) => setJSON(KEYS.profile, profile),
  updateProfile: async (updater: (profile: UserProfile) => UserProfile) => {
    const current =
      (await getJSON<UserProfile | null>(KEYS.profile, null)) ?? createDefaultUserProfile();
    const next = updater(current);
    await setJSON(KEYS.profile, next);
    return next;
  },
  /** Ensures a profile row exists (first launch / migration). */
  ensureProfile: async (): Promise<UserProfile> => {
    const existing = await getJSON<UserProfile | null>(KEYS.profile, null);
    if (existing) return existing;
    const created = createDefaultUserProfile();
    await setJSON(KEYS.profile, created);
    return created;
  },

  getFriends: () => getJSON<Friend[]>(KEYS.friends, []),
  setFriends: (friends: Friend[]) => setJSON(KEYS.friends, friends),
  updateFriends: (updater: (friends: Friend[]) => Friend[]) =>
    updateJSON<Friend[]>(KEYS.friends, [], updater),

  getWalletAuthToken: async (): Promise<string | null> => AsyncStorage.getItem(KEYS.walletAuthToken),
  setWalletAuthToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(KEYS.walletAuthToken, token);
  },
  clearWalletAuthToken: async (): Promise<void> => {
    await AsyncStorage.removeItem(KEYS.walletAuthToken);
  },
};
