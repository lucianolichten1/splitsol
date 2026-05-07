import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { GroupCard } from "../components/GroupCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useFriends } from "../hooks/useFriends";
import { useGroups } from "../hooks/useGroups";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { getGroupSplitStatsMap } from "../lib/groupSplitStats";
import {
  makeSelfParticipant,
  normalizeParticipantsForSplit,
  participantMatchesProfile,
} from "../lib/currentUserParticipant";
import { storage } from "../lib/storage";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Participant } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "CreateSplit">;
type CreateMode = "group" | "direct";

export function CreateSplitScreen({ navigation, route }: Props) {
  const { groups, refresh } = useGroups();
  const { friends, refresh: refreshFriends } = useFriends();
  const { profile, refreshProfile } = useProfile();
  const { splits, refresh: refreshSplits } = useSplits();

  const [mode, setMode] = useState<CreateMode>("group");
  const [name, setName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showOtherGroups, setShowOtherGroups] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<Set<string>>(new Set());
  const [directMembers, setDirectMembers] = useState<Participant[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const initializedGroupRef = useRef<string | null>(null);

  const splitStatsByGroup = useMemo(() => getGroupSplitStatsMap(groups, splits), [groups, splits]);

  const membersForGroup = useCallback(
    (groupId: string): Participant[] => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return [];
      if (!profile) return group.members;
      return normalizeParticipantsForSplit(group.members.map((m) => ({ ...m })), profile);
    },
    [groups, profile]
  );

  const groupMembersPreview = useMemo(
    () => (selectedGroupId ? membersForGroup(selectedGroupId) : []),
    [selectedGroupId, membersForGroup]
  );

  const selectedGroup = useMemo(
    () => (selectedGroupId ? groups.find((g) => g.id === selectedGroupId) ?? null : null),
    [groups, selectedGroupId]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshFriends();
      refreshProfile();
      refreshSplits();
      const preset = route.params?.presetGroupId;
      if (typeof preset === "string" && preset.length > 0) {
        setSelectedGroupId((prev) => (prev === preset ? prev : preset));
        setMode("group");
        setShowOtherGroups(false);
      }
    }, [refresh, refreshFriends, refreshProfile, refreshSplits, route.params?.presetGroupId])
  );

  useFocusEffect(
    useCallback(() => {
      if (!profile) return;
      setDirectMembers((prev) => {
        const hasSelf = prev.some((m) => participantMatchesProfile(m, profile));
        if (hasSelf) return prev;
        return [makeSelfParticipant(profile), ...prev];
      });
    }, [profile])
  );

  useEffect(() => {
    if (!selectedGroupId) {
      initializedGroupRef.current = null;
      return;
    }
    if (initializedGroupRef.current === selectedGroupId) return;
    const members = membersForGroup(selectedGroupId);
    setSelectedGroupMemberIds(new Set(members.map((m) => m.id)));
    initializedGroupRef.current = selectedGroupId;
  }, [selectedGroupId, membersForGroup]);

  const directFriendIds = useMemo(
    () => new Set(directMembers.map((m) => m.friendId).filter((x): x is string => !!x)),
    [directMembers]
  );

  const availableFriends = useMemo(() => friends.filter((f) => !directFriendIds.has(f.id)), [friends, directFriendIds]);

  const filteredAvailableFriends = useMemo(() => {
    const query = friendSearch.trim().toLowerCase();
    if (!query) return availableFriends;
    return availableFriends.filter((f) => {
      const displayName = f.displayName.toLowerCase();
      const username = f.username.toLowerCase();
      return displayName.includes(query) || username.includes(query);
    });
  }, [availableFriends, friendSearch]);

  const addFriendToDirect = (friend: (typeof friends)[number]) => {
    setDirectMembers((prev) => {
      if (prev.some((m) => m.friendId === friend.id)) return prev;
      return [
        ...prev,
        {
          id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          nickname: friend.displayName,
          username: friend.username,
          friendId: friend.id,
          walletAddress: friend.walletAddress,
        },
      ];
    });
  };

  const removeDirectMember = (id: string) => {
    if (profile) {
      const target = directMembers.find((m) => m.id === id);
      if (target && participantMatchesProfile(target, profile)) {
        Alert.alert("You stay included", "You are automatically included in direct transactions.");
        return;
      }
    }
    setDirectMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowOtherGroups(false);
    const members = membersForGroup(groupId);
    setSelectedGroupMemberIds(new Set(members.map((m) => m.id)));
    initializedGroupRef.current = groupId;
  };

  const toggleGroupMember = (member: Participant) => {
    const isMe = !!(profile && participantMatchesProfile(member, profile));
    if (isMe) {
      Alert.alert("You stay included", "You are always included in transactions you create.");
      return;
    }
    setSelectedGroupMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(member.id)) {
        next.delete(member.id);
      } else {
        next.add(member.id);
      }
      return next;
    });
  };

  const continueNext = async () => {
    if (!name.trim()) {
      Alert.alert("Transaction name required", "Enter a name (for example Dinner at Casa or Uber to airport).");
      return;
    }

    const profileData = profile ?? (await storage.ensureProfile());

    if (mode === "group") {
      if (!selectedGroupId) {
        Alert.alert("Group required", "Choose a group or switch to Direct with friends.");
        return;
      }
      const latestGroups = await storage.getGroups();
      const group = latestGroups.find((g) => g.id === selectedGroupId);
      if (!group) {
        Alert.alert("Group not found", "Go back and choose the group again.");
        return;
      }

      const fullSnapshot = normalizeParticipantsForSplit(
        group.members.map((m) => ({ ...m })),
        profileData
      );
      const filteredSnapshot = fullSnapshot.filter((m) => selectedGroupMemberIds.has(m.id));

      if (filteredSnapshot.length < 2) {
        Alert.alert("Need at least 2 people", "Select at least two people for this transaction.");
        return;
      }

      navigation.navigate("AddExpenses", {
        name: name.trim(),
        participants: filteredSnapshot,
        groupId: group.id,
        groupName: group.name,
      });
      return;
    }

    const directSnapshot = normalizeParticipantsForSplit(
      directMembers.map((m) => ({ ...m })),
      profileData
    );

    if (directSnapshot.length < 2) {
      Alert.alert(
        "Need at least 2 participants",
        "Direct transactions require you plus at least one friend."
      );
      return;
    }

    navigation.navigate("AddExpenses", {
      name: name.trim(),
      participants: directSnapshot,
      groupName: "Direct",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Create a transaction from a saved group or directly with friends. On the next step you&apos;ll add expenses
            in SOL for this demo.
          </Text>

          <Text style={[styles.label, styles.labelFirst]}>1 · Transaction type</Text>
          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "group" }}
              style={[styles.modeChip, mode === "group" && styles.modeChipSelected]}
              onPress={() => setMode("group")}
            >
              <Text style={[styles.modeChipText, mode === "group" && styles.modeChipTextSelected]}>From a group</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === "direct" }}
              style={[styles.modeChip, mode === "direct" && styles.modeChipSelected]}
              onPress={() => setMode("direct")}
            >
              <Text style={[styles.modeChipText, mode === "direct" && styles.modeChipTextSelected]}>Direct with friends</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>2 · Transaction name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Friday tacos"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />

          {mode === "group" ? (
            <>
              <Text style={styles.label}>3 · Choose group</Text>
              <Text style={styles.hint}>Participants are snapshotted from this group when you continue.</Text>

              {groups.length === 0 ? (
                <View style={styles.emptyCallout}>
                  <Text style={styles.emptyCalloutTitle}>No groups yet</Text>
                  <Text style={styles.emptyCalloutBody}>Create a group below, or switch to Direct with friends.</Text>
                </View>
              ) : selectedGroup ? (
                <>
                  <View style={styles.cardWrap}>
                    <GroupCard
                      group={selectedGroup}
                      selected
                      activeSplitsCount={splitStatsByGroup.get(selectedGroup.id)?.activeSplitsCount}
                      latestSplitName={splitStatsByGroup.get(selectedGroup.id)?.latestSplitName}
                      onPress={() => setShowOtherGroups((v) => !v)}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.switchGroupsBtn, pressed && { opacity: 0.9 }]}
                    onPress={() => setShowOtherGroups((v) => !v)}
                  >
                    <Text style={styles.switchGroupsText}>
                      {showOtherGroups ? "Hide other groups ▲" : "Change group ▼"}
                    </Text>
                  </Pressable>
                  {showOtherGroups
                    ? groups
                        .filter((g) => g.id !== selectedGroup.id)
                        .map((g) => (
                          <View key={g.id} style={styles.cardWrap}>
                            <GroupCard
                              group={g}
                              activeSplitsCount={splitStatsByGroup.get(g.id)?.activeSplitsCount}
                              latestSplitName={splitStatsByGroup.get(g.id)?.latestSplitName}
                              onPress={() => handleSelectGroup(g.id)}
                            />
                          </View>
                        ))
                    : null}
                </>
              ) : (
                groups.map((g) => (
                  <View key={g.id} style={styles.cardWrap}>
                    <GroupCard
                      group={g}
                      activeSplitsCount={splitStatsByGroup.get(g.id)?.activeSplitsCount}
                      latestSplitName={splitStatsByGroup.get(g.id)?.latestSplitName}
                      onPress={() => handleSelectGroup(g.id)}
                    />
                  </View>
                ))
              )}

              <Pressable
                accessibilityRole="button"
                android_ripple={{ color: "#ffffff22" }}
                style={({ pressed }) => [styles.newGroupBtn, pressed && { opacity: 0.92 }]}
                onPress={() => navigation.navigate("CreateEditGroup", { cameFrom: "split" })}
              >
                <Text style={styles.newGroupBtnText}>+ Create new group</Text>
              </Pressable>

              <Text style={styles.subLabel}>People in this group (tap to include)</Text>
              {selectedGroupId && groupMembersPreview.length > 0 ? (
                <View style={styles.chips}>
                  {groupMembersPreview.map((m) => {
                    const isMe = !!(profile && participantMatchesProfile(m, profile));
                    const selected = selectedGroupMemberIds.has(m.id);
                    return (
                      <Pressable
                        key={m.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          styles.chip,
                          selected ? styles.chipSelected : styles.chipUnselected,
                          isMe && styles.chipSelf,
                        ]}
                        onPress={() => toggleGroupMember(m)}
                      >
                        <Text style={styles.chipText} numberOfLines={2}>
                          {m.nickname}
                          {m.username ? ` · @${m.username}` : ""}
                        </Text>
                        <Text style={styles.chipBadge}>{isMe ? "You" : selected ? "Selected" : "Not selected"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.mutedSmall}>Select a group to choose participants for this transaction.</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.label}>3 · Participants</Text>
              <Text style={styles.hint}>Who is on this expense. You are included automatically.</Text>

              <View style={styles.chips}>
                {directMembers.map((m) => {
                  const isMe = !!(profile && participantMatchesProfile(m, profile));
                  return (
                    <Pressable
                      key={m.id}
                      accessibilityRole="button"
                      style={[styles.chip, isMe ? styles.chipSelf : styles.chipAdded]}
                      onPress={() => removeDirectMember(m.id)}
                    >
                      <Text style={styles.chipText} numberOfLines={2}>
                        {m.nickname}
                        {m.username ? ` · @${m.username}` : ""}
                      </Text>
                      <Text style={styles.chipBadge}>{isMe ? "You" : "tap to remove"}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.subLabel}>Search friends</Text>
              <TextInput
                value={friendSearch}
                onChangeText={setFriendSearch}
                placeholder="Search by name or @username"
                placeholderTextColor={colors.textDim}
                style={styles.input}
              />
              {availableFriends.length === 0 ? (
                <Text style={styles.mutedSmall}>No additional saved friends available. Add from Friends & Groups if needed.</Text>
              ) : filteredAvailableFriends.length === 0 ? (
                <Text style={styles.mutedSmall}>No friends match your search.</Text>
              ) : (
                <View style={styles.friendResults}>
                  {filteredAvailableFriends.map((f) => (
                    <Pressable
                      key={f.id}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.friendRow, pressed && { opacity: 0.92 }]}
                      onPress={() => addFriendToDirect(f)}
                    >
                      <View>
                        <Text style={styles.friendRowName} numberOfLines={1}>
                          {f.displayName}
                        </Text>
                        <Text style={styles.friendRowMeta} numberOfLines={1}>
                          @{f.username}
                        </Text>
                      </View>
                      <Text style={styles.friendRowAction}>Add</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={continueNext}
      >
        <Text style={styles.ctaText}>Continue to expenses</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  label: {
    ...typography.overline,
    marginTop: spacing.lg,
  },
  labelFirst: {
    marginTop: 0,
  },
  intro: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
  },
  modeChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  modeChipText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  modeChipTextSelected: {
    color: colors.accent,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    backgroundColor: colors.surfaceElevated,
    minHeight: 52,
    fontSize: 16,
  },
  emptyCallout: {
    backgroundColor: colors.warningMuted,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyCalloutTitle: {
    ...typography.subhead,
    fontSize: 16,
    color: colors.warning,
    fontWeight: "700",
  },
  emptyCalloutBody: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
    fontSize: 13,
  },
  cardWrap: {
    marginBottom: spacing.xs,
  },
  switchGroupsBtn: {
    alignSelf: "flex-start",
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
  },
  switchGroupsText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  newGroupBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    minHeight: touch.minHeight,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  newGroupBtnText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  subLabel: {
    ...typography.overline,
    marginTop: spacing.md,
    fontSize: 10,
  },
  mutedSmall: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  friendResults: {
    gap: spacing.xs,
  },
  friendRow: {
    minHeight: touch.minHeight + 4,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.cardSubtle,
  },
  friendRowName: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
  },
  friendRowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  friendRowAction: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
    fontSize: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    gap: 4,
    ...shadows.cardSubtle,
  },
  chipSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    opacity: 0.75,
  },
  chipSelf: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderWidth: 2,
    opacity: 1,
  },
  chipNormal: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  chipAdded: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
    borderWidth: 2,
    ...shadows.fab,
  },
  chipText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  chipBadge: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
  },
  cta: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    ...shadows.card,
  },
  ctaPressed: {
    opacity: 0.94,
  },
  ctaText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
});
