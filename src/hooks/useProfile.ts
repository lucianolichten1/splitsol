import { useCallback, useEffect, useState } from "react";
import { createDefaultUserProfile } from "../lib/defaultProfile";
import { storage } from "../lib/storage";
import { UserProfile } from "../types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storage.ensureProfile();
      setProfile(data);
      return data;
    } catch {
      try {
        const fallback = createDefaultUserProfile();
        await storage.setProfile(fallback);
        setProfile(fallback);
        return fallback;
      } catch {
        const memory = createDefaultUserProfile();
        setProfile(memory);
        return memory;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const getProfile = useCallback(async () => storage.ensureProfile(), []);

  const updateProfile = useCallback(
    async (
      patch: Partial<Pick<UserProfile, "displayName" | "username" | "mockWalletAddress">>
    ) => {
      const next = await storage.updateProfile((current) => {
        const now = new Date().toISOString();
        const username =
          patch.username !== undefined
            ? patch.username.trim().toLowerCase()
            : current.username;
        const displayName =
          patch.displayName !== undefined ? patch.displayName.trim() : current.displayName;
        let mockWalletAddress = current.mockWalletAddress;
        if (patch.mockWalletAddress !== undefined) {
          const t = patch.mockWalletAddress.trim();
          mockWalletAddress = t.length > 0 ? t : undefined;
        }
        return {
          ...current,
          displayName,
          username,
          mockWalletAddress,
          updatedAt: now,
        };
      });
      setProfile(next);
      return next;
    },
    []
  );

  return {
    profile,
    loading,
    refreshProfile,
    getProfile,
    updateProfile,
  };
}
