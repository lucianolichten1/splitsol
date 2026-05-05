import { useCallback, useMemo } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useGroups } from "../hooks/useGroups";
import { useSplits } from "../hooks/useSplits";
import { navigateRoot } from "../lib/navigateRoot";
import { GroupsStackParamList } from "../navigation/groupsStackTypes";

type Props = NativeStackScreenProps<GroupsStackParamList, "GroupDetail">;

export function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { getGroupById, deleteGroup, refresh: refreshGroups, loading: groupsLoading } = useGroups();
  const { splits, refresh: refreshSplits } = useSplits();

  useFocusEffect(
    useCallback(() => {
      refreshGroups();
      refreshSplits();
    }, [refreshGroups, refreshSplits])
  );

  const group = getGroupById(groupId);

  const groupSplits = useMemo(
    () =>
      [...splits]
        .filter((s) => s.groupId === groupId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [splits, groupId]
  );

  if (groupsLoading && !group) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  const tryDelete = async () => {
    const ok = await deleteGroup(groupId);
    if (!ok) {
      Alert.alert(
        "Cannot delete group",
        "This group still has splits. Remove or reassign splits before deleting."
      );
      return;
    }
    navigation.goBack();
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Text style={styles.muted}>Group not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} numberOfLines={2}>
          {group.name}
        </Text>
        {group.description ? <Text style={styles.description}>{group.description}</Text> : null}

        <Text style={styles.section}>Members</Text>
        <View style={styles.memberList}>
          {group.members.length === 0 ? (
            <Text style={styles.muted}>No members yet. Tap Edit to add people.</Text>
          ) : (
            group.members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberTop}>
                  <Text style={styles.memberName}>{m.nickname}</Text>
                  <View style={[styles.sourceBadge, m.friendId ? styles.sourceFriend : styles.sourceManual]}>
                    <Text style={[styles.sourceBadgeText, m.friendId && styles.sourceBadgeTextFriend]}>
                      {m.friendId ? "Friend" : "Manual"}
                    </Text>
                  </View>
                </View>
                {m.friendId ? (
                  <Text style={styles.memberMeta}>
                    Saved contact{m.username ? ` · @${m.username}` : ""}
                  </Text>
                ) : (
                  <Text style={styles.memberMeta}>Added by nickname only</Text>
                )}
              </View>
            ))
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "#00000022" }}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.94 }]}
          onPress={() =>
            navigateRoot(navigation, "CreateSplit", {
              presetGroupId: group.id,
            })
          }
        >
          <Text style={styles.primaryBtnText}>Create split in this group</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          android_ripple={{ color: "#ffffff22" }}
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.92 }]}
          onPress={() => navigateRoot(navigation, "CreateEditGroup", { groupId, cameFrom: "groups" })}
        >
          <Text style={styles.secondaryBtnText}>Edit group & members</Text>
        </Pressable>

        <Text style={styles.section}>Splits in this group</Text>
        <View style={styles.splitList}>
          {groupSplits.length === 0 ? (
            <Text style={styles.muted}>No splits yet for this group.</Text>
          ) : (
            groupSplits.map((item) => (
              <SplitCard
                key={item.id}
                split={item}
                onPress={() => navigateRoot(navigation, "SplitSummary", { splitId: item.id })}
              />
            ))
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.danger, pressed && { opacity: 0.9 }]}
          onPress={() => {
            Alert.alert("Delete group?", "You can only delete a group with no splits.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: tryDelete },
            ]);
          }}
        >
          <Text style={styles.dangerText}>Delete group</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  splitList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    fontSize: 22,
  },
  description: {
    ...typography.body,
    color: colors.textMuted,
  },
  section: {
    ...typography.overline,
    marginTop: spacing.sm,
  },
  memberList: {
    gap: spacing.sm,
  },
  memberRow: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touch.minHeight,
    justifyContent: "center",
    gap: spacing.xs,
    ...shadows.cardSubtle,
  },
  memberTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  memberName: {
    ...typography.body,
    fontWeight: "700",
    flex: 1,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sourceFriend: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  sourceManual: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  sourceBadgeTextFriend: {
    color: colors.primary,
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  muted: {
    ...typography.caption,
    color: colors.textMuted,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: touch.minHeight + 2,
    justifyContent: "center",
    ...shadows.cardSubtle,
  },
  secondaryBtnText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    minHeight: touch.minHeight + 8,
    justifyContent: "center",
    ...shadows.card,
  },
  primaryBtnText: {
    color: colors.background,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  danger: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  dangerText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 15,
  },
});
