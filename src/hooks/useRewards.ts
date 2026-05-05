import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { BADGE_DEFINITIONS, POINTS } from "../constants/rewards";
import { storage } from "../lib/storage";
import { Badge, RewardAction, RewardsProfile, Split } from "../types";

function hasBadge(profile: RewardsProfile, badgeId: string): boolean {
  return profile.badges.some((badge) => badge.id === badgeId);
}

function createBadge(badge: Omit<Badge, "earnedAt">): Badge {
  return { ...badge, earnedAt: new Date().toISOString() };
}

export function useRewards() {
  const [profile, setProfile] = useState<RewardsProfile>({ totalPoints: 0, badges: [] });
  const [newBadge, setNewBadge] = useState<Badge | null>(null);

  const refresh = useCallback(async () => {
    const data = await storage.getRewards();
    setProfile(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const dismissBadge = useCallback(() => setNewBadge(null), []);

  const checkAndAwardRewards = useCallback(
    async (action: RewardAction, splits: Split[]) => {
      const current = await storage.getRewards();
      let updated = { ...current, badges: [...current.badges] };
      let earnedNow: Badge | null = null;
      const maybeAddBadge = (badge: Omit<Badge, "earnedAt">) => {
        if (!hasBadge(updated, badge.id)) {
          const earned = createBadge(badge);
          updated = { ...updated, badges: [earned, ...updated.badges] };
          return earned;
        }
        return null;
      };

      const totalSplits = splits.length;
      const hasSettledSplit = splits.some((split) => split.status === "settled");

      if (action === "split_created" && totalSplits === 1) {
        updated.totalPoints += POINTS.firstSplit;
        earnedNow = maybeAddBadge(BADGE_DEFINITIONS.firstSplit) ?? earnedNow;
      }

      if (action === "balance_settled") {
        updated.totalPoints += POINTS.settleEntry;
      }

      if (action === "split_fully_settled" && hasSettledSplit) {
        updated.totalPoints += POINTS.fullySettleSplit;
        earnedNow = maybeAddBadge(BADGE_DEFINITIONS.allSquare) ?? earnedNow;
      }

      if (totalSplits >= 3 && !hasBadge(updated, BADGE_DEFINITIONS.groupTreasurer.id)) {
        updated.totalPoints += POINTS.threeSplitsBonus;
        earnedNow = maybeAddBadge(BADGE_DEFINITIONS.groupTreasurer) ?? earnedNow;
      }

      await storage.setRewards(updated);
      setProfile(updated);
      if (earnedNow) {
        setNewBadge(earnedNow);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    []
  );

  return {
    profile,
    refresh,
    newBadge,
    dismissBadge,
    checkAndAwardRewards,
  };
}
