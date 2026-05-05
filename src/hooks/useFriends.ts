import { useCallback, useEffect, useState } from "react";
import { randomUuid } from "../lib/randomUuid";
import { storage } from "../lib/storage";
import { Friend } from "../types";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storage.getFriends();
      setFriends(data);
      return data;
    } catch {
      setFriends([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getFriends = useCallback(async () => storage.getFriends(), []);

  const getFriendById = useCallback(
    (id: string) => friends.find((f) => f.id === id),
    [friends]
  );

  const addFriend = useCallback(
    async (input: Pick<Friend, "displayName" | "username"> & { walletAddress?: string }) => {
      const username = input.username.trim().toLowerCase();
      const displayName = input.displayName.trim();
      if (!username || !displayName) {
        throw new Error("Display name and username are required.");
      }
      const current = await storage.getFriends();
      if (current.some((f) => f.username.toLowerCase() === username)) {
        throw new Error("A friend with this username already exists.");
      }
      const now = new Date().toISOString();
      const friend: Friend = {
        id: randomUuid(),
        displayName,
        username,
        walletAddress: input.walletAddress?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const next = await storage.updateFriends((list) => [friend, ...list]);
      setFriends(next);
      return friend;
    },
    []
  );

  const updateFriend = useCallback(
    async (
      friendId: string,
      patch: Partial<Pick<Friend, "displayName" | "username" | "walletAddress">>
    ) => {
      const current = await storage.getFriends();
      const target = current.find((f) => f.id === friendId);
      if (!target) {
        throw new Error("Friend not found.");
      }
      const username =
        patch.username !== undefined ? patch.username.trim().toLowerCase() : target.username;
      const displayName =
        patch.displayName !== undefined ? patch.displayName.trim() : target.displayName;
      if (!username || !displayName) {
        throw new Error("Display name and username are required.");
      }
      const walletRaw = patch.walletAddress !== undefined ? patch.walletAddress.trim() : undefined;
      const walletAddress =
        walletRaw !== undefined ? (walletRaw.length > 0 ? walletRaw : undefined) : target.walletAddress;
      if (
        patch.username !== undefined &&
        current.some((f) => f.id !== friendId && f.username.toLowerCase() === username)
      ) {
        throw new Error("A friend with this username already exists.");
      }
      const now = new Date().toISOString();
      const next = await storage.updateFriends((list) =>
        list.map((f) =>
          f.id === friendId ? { ...f, displayName, username, walletAddress, updatedAt: now } : f
        )
      );
      setFriends(next);
    },
    []
  );

  const deleteFriend = useCallback(async (friendId: string) => {
    const next = await storage.updateFriends((current) => current.filter((f) => f.id !== friendId));
    setFriends(next);
  }, []);

  return {
    friends,
    loading,
    refresh,
    getFriends,
    getFriendById,
    addFriend,
    updateFriend,
    deleteFriend,
  };
}
