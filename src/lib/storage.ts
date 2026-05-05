import AsyncStorage from "@react-native-async-storage/async-storage";
import { RewardsProfile, Split } from "../types";

const KEYS = {
  splits: "splitsol:splits",
  rewards: "splitsol:rewards",
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
  getRewards: () =>
    getJSON<RewardsProfile>(KEYS.rewards, { totalPoints: 0, badges: [] }),
  setRewards: (profile: RewardsProfile) => setJSON(KEYS.rewards, profile),
  updateRewards: (updater: (profile: RewardsProfile) => RewardsProfile) =>
    updateJSON<RewardsProfile>(KEYS.rewards, { totalPoints: 0, badges: [] }, updater),
};
