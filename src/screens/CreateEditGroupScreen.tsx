import { useCallback, useEffect, useState } from "react";
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
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useFriends } from "../hooks/useFriends";
import { useGroups } from "../hooks/useGroups";
import { useProfile } from "../hooks/useProfile";
import {
  ensureCurrentUserInMembers,
  makeSelfParticipant,
  participantMatchesProfile,
} from "../lib/currentUserParticipant";
import { RootStackParamList } from "../navigation/RootNavigator";
import { Friend, Group, Participant } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "CreateEditGroup">;

export function CreateEditGroupScreen({ navigation, route }: Props) {
  const { groupId, cameFrom = "groups" } = route.params ?? {};
  const isEdit = !!groupId;
  const { getGroupById, addGroup, updateGroup, refresh } = useGroups();
  const { friends, refresh: refreshFriends } = useFriends();
  const { profile, refreshProfile, getProfile } = useProfile();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<Participant[]>([]);

  useFocusEffect(
    useCallback(() => {
      refreshFriends();
      refreshProfile();
    }, [refreshFriends, refreshProfile])
  );

  useEffect(() => {
    if (groupId || !profile) return;
    setMembers((prev) => {
      if (prev.some((m) => participantMatchesProfile(m, profile))) return prev;
      return [makeSelfParticipant(profile), ...prev];
    });
  }, [groupId, profile]);

  useEffect(() => {
    if (!groupId) return;
    const g = getGroupById(groupId);
    if (!g) {
      refresh();
      return;
    }
    if (!profile) return;
    const tagged = g.members.map((m) =>
      participantMatchesProfile(m, profile)
        ? { ...m, isCurrentUser: true }
        : m.isCurrentUser
          ? { ...m, isCurrentUser: false }
          : m
    );
    const withSelf = tagged.some((m) => participantMatchesProfile(m, profile))
      ? tagged
      : [makeSelfParticipant(profile), ...tagged];
    setName(g.name);
    setDescription(g.description ?? "");
    setMembers(withSelf);
  }, [groupId, getGroupById, refresh, profile]);

  const addMember = () => {
    const nickname = memberInput.trim();
    if (!nickname) return;
    setMembers((prev) => [...prev, { id: `m-${Date.now()}-${prev.length}`, nickname }]);
    setMemberInput("");
  };

  const addFriendAsMember = (friend: Friend) => {
    setMembers((prev) => {
      if (prev.some((m) => m.friendId === friend.id)) return prev;
      const id = `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      return [
        ...prev,
        {
          id,
          nickname: friend.displayName,
          username: friend.username,
          friendId: friend.id,
          walletAddress: friend.walletAddress,
        },
      ];
    });
  };

  const removeMember = (id: string) => {
    if (profile) {
      const target = members.find((m) => m.id === id);
      if (target && participantMatchesProfile(target, profile)) {
        Alert.alert(
          "You stay in the group",
          "You cannot remove yourself from a group you belong to."
        );
        return;
      }
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const friendsAvailable = friends.filter((f) => {
    if (members.some((m) => m.friendId === f.id)) return false;
    if (profile && f.username.toLowerCase() === profile.username.toLowerCase()) return false;
    return true;
  });

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Group name required", "Enter a name for this group so you can find it later.");
      return;
    }
    const now = new Date().toISOString();

    const profileData = profile ?? (await getProfile());
    const membersWithSelf = ensureCurrentUserInMembers(members, profileData);
    if (membersWithSelf.length < 2) {
      Alert.alert(
        "Need at least 2 members",
        "You’re always included. Add at least one other person (friend or nickname) so you can split expenses."
      );
      return;
    }

    if (isEdit) {
      await updateGroup(groupId, (g) => ({
        ...g,
        name: name.trim(),
        description: description.trim() || undefined,
        members: membersWithSelf,
        updatedAt: now,
      }));
      navigation.goBack();
      return;
    }

    const newGroup: Group = {
      id: `g-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      members: membersWithSelf,
      createdAt: now,
      updatedAt: now,
    };
    await addGroup(newGroup);

    if (cameFrom === "split") {
      navigation.navigate({
        name: "CreateSplit",
        params: { presetGroupId: newGroup.id },
        merge: true,
      });
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.label, styles.labelFirst]}>Group name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Miami Trip"
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Beach house, flights, food"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            multiline
          />

          <Text style={styles.label}>Members</Text>
          <Text style={styles.hint}>
            You appear as <Text style={styles.hintBold}>Me</Text>—always in the group and not removable. Add at least one
            other person via friends or a manual nickname (need 2+ people total to split).
          </Text>

          <Text style={styles.subLabel}>From friends</Text>
          {friendsAvailable.length === 0 ? (
            <Text style={styles.mutedSmall}>
              {friends.length === 0
                ? "No saved friends yet. Add friends under Profile, or use manual nicknames below."
                : "All saved friends are already in this group."}
            </Text>
          ) : (
            <View style={styles.friendPickRow}>
              {friendsAvailable.map((f) => (
                <Pressable
                  key={f.id}
                  accessibilityRole="button"
                  android_ripple={{ color: "#ffffff22" }}
                  style={({ pressed }) => [styles.friendPick, pressed && { opacity: 0.92 }]}
                  onPress={() => addFriendAsMember(f)}
                >
                  <Text style={styles.friendPickText} numberOfLines={1}>
                    {f.displayName}
                  </Text>
                  <Text style={styles.friendPickMeta} numberOfLines={1}>
                    @{f.username}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.subLabel}>Manual nickname</Text>
          <View style={styles.row}>
            <TextInput
              value={memberInput}
              onChangeText={setMemberInput}
              placeholder="Nickname"
              placeholderTextColor={colors.textDim}
              style={[styles.input, styles.flex]}
            />
            <Pressable
              accessibilityRole="button"
              android_ripple={{ color: "#ffffff22" }}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={addMember}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          <View style={styles.chips}>
            {members.map((m) => {
              const isYou = !!(profile && participantMatchesProfile(m, profile));
              const chipStyle = m.friendId ? styles.chipFriend : isYou ? styles.chipSelf : styles.chipManual;
              const badgeText = m.friendId
                ? "Saved friend"
                : isYou
                  ? "You"
                  : "Manual";
              const removeHint = isYou ? "You are always included when you create a group" : "Removes this member from the group";
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityHint={removeHint}
                  style={[styles.chip, chipStyle]}
                  onPress={() => removeMember(m.id)}
                >
                  <Text style={styles.chipText} numberOfLines={2}>
                    {m.nickname}
                    {m.friendId && m.username ? ` · @${m.username}` : ""}
                  </Text>
                  <Text style={styles.chipBadge}>
                    {badgeText}
                    {!isYou ? " · tap to remove" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        accessibilityRole="button"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={save}
      >
        <Text style={styles.ctaText}>{isEdit ? "Save changes" : "Save group"}</Text>
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
  hint: {
    ...typography.caption,
    color: colors.textDim,
    lineHeight: 18,
  },
  hintBold: {
    color: colors.accent,
    fontWeight: "700",
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
  friendPickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  friendPick: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    maxWidth: "48%",
    flexGrow: 1,
    minWidth: "42%",
    minHeight: touch.minHeight + 4,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  friendPickText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.text,
    fontSize: 13,
  },
  friendPickMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonPressed: {
    opacity: 0.92,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touch.minHeight + 6,
    justifyContent: "center",
    gap: 4,
    ...shadows.cardSubtle,
  },
  chipFriend: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryMuted,
  },
  chipManual: {
    borderColor: colors.border,
  },
  chipSelf: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: colors.surfaceElevated,
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
    marginTop: 2,
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
    fontWeight: "700",
    fontSize: 16,
  },
});
