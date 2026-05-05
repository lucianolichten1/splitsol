import { useCallback, useEffect, useState } from "react";
import { storage } from "../lib/storage";
import { Group, Participant } from "../types";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await storage.getGroups();
      setGroups(data);
      return data;
    } catch {
      setGroups([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getGroupById = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups]
  );

  const getGroups = useCallback(async () => storage.getGroups(), []);

  const addGroup = useCallback(async (group: Group) => {
    const next = await storage.updateGroups((current) => [group, ...current]);
    setGroups(next);
    return next;
  }, []);

  const updateGroup = useCallback(async (groupId: string, updater: (g: Group) => Group) => {
    const next = await storage.updateGroups((current) =>
      current.map((g) => (g.id === groupId ? updater(g) : g))
    );
    setGroups(next);
    return next;
  }, []);

  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    const splits = await storage.getSplits();
    if (splits.some((s) => s.groupId === groupId)) {
      return false;
    }
    const next = await storage.updateGroups((current) => current.filter((g) => g.id !== groupId));
    setGroups(next);
    return true;
  }, []);

  const addMemberToGroup = useCallback(
    async (groupId: string, member: Participant) => {
      const now = new Date().toISOString();
      return updateGroup(groupId, (g) => ({
        ...g,
        members: [...g.members, member],
        updatedAt: now,
      }));
    },
    [updateGroup]
  );

  const removeMemberFromGroup = useCallback(
    async (groupId: string, memberId: string) => {
      const now = new Date().toISOString();
      return updateGroup(groupId, (g) => ({
        ...g,
        members: g.members.filter((m) => m.id !== memberId),
        updatedAt: now,
      }));
    },
    [updateGroup]
  );

  return {
    loading,
    groups,
    refresh,
    getGroupById,
    getGroups,
    addGroup,
    updateGroup,
    deleteGroup,
    addMemberToGroup,
    removeMemberFromGroup,
  };
}
