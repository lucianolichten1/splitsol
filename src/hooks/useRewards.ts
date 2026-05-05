import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { BADGE_DEFINITIONS, POINTS } from "../constants/rewards";
import { storage } from "../lib/storage";
import { Badge, Group, RewardAction, RewardsProfile, Split } from "../types";

export type RewardPayload = {
  splits?: Split[];
  groups?: Group[];
};

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
    async (action: RewardAction, payload: RewardPayload = {}) => {
      const resolvedSplits =
        action === "group_created" ? [] : payload.splits ?? (await storage.getSplits());
      const resolvedGroups =
        action === "group_created"
          ? payload.groups ?? (await storage.getGroups())
          : [];

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

      if (action === "group_created") {
        const totalGroups = resolvedGroups.length;
        if (totalGroups === 1) {
          const squad = maybeAddBadge(BADGE_DEFINITIONS.squadStarter);
          if (squad) {
            updated.totalPoints += POINTS.firstGroup;
            earnedNow = squad;
          }
        }
        if (totalGroups >= 3) {
          const trip = maybeAddBadge(BADGE_DEFINITIONS.tripOrganizer);
          if (trip) {
            updated.totalPoints += POINTS.threeGroupsBonus;
            earnedNow = trip ?? earnedNow;
          }
        }
      }

      const totalSplits = resolvedSplits.length;

      if (action === "split_created" && totalSplits === 1) {
        const first = maybeAddBadge(BADGE_DEFINITIONS.firstSplit);
        if (first) {
          updated.totalPoints += POINTS.firstSplit;
          earnedNow = first;
        }
      }

      if (action === "split_created" && totalSplits >= 3) {
        const treasurer = maybeAddBadge(BADGE_DEFINITIONS.groupTreasurer);
        if (treasurer) {
          updated.totalPoints += POINTS.threeSplitsBonus;
          earnedNow = treasurer ?? earnedNow;
        }
      }

      if (action === "balance_settled") {
        updated.totalPoints += POINTS.settleEntry;
      }

      if (action === "split_fully_settled") {
        updated.totalPoints += POINTS.fullySettleSplit;
        const allSquare = maybeAddBadge(BADGE_DEFINITIONS.allSquare);
        if (allSquare) {
          earnedNow = allSquare ?? earnedNow;
        }
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
