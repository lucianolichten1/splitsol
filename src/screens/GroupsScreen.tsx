import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GroupCard } from "../components/GroupCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useGroups } from "../hooks/useGroups";
import { useSplits } from "../hooks/useSplits";
import { getGroupSplitStatsMap } from "../lib/groupSplitStats";
import { navigateRoot } from "../lib/navigateRoot";
import { GroupsStackParamList } from "../navigation/groupsStackTypes";

type Nav = NativeStackNavigationProp<GroupsStackParamList>;

const FAB_SIZE = 60;

export function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { groups, loading, refresh } = useGroups();
  const { splits, refresh: refreshSplits } = useSplits();

  const splitStatsByGroup = useMemo(
    () => getGroupSplitStatsMap(groups, splits),
    [groups, splits]
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshSplits();
    }, [refresh, refreshSplits])
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>Start with a group</Text>
        <Text style={styles.listHeaderSub}>
          Groups hold everyone you split with. Create a group first, then add a transaction from the group or the Transactions tab.
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading groups" />
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySub}>
                Create a group as the first step—add friends or nicknames, then you can start a split. Tap + below.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const stats = splitStatsByGroup.get(item.id);
          return (
            <GroupCard
              group={item}
              activeSplitsCount={stats?.activeSplitsCount}
              latestSplitName={stats?.latestSplitName}
              onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
            />
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create new group"
        android_ripple={{ color: "#ffffff33" }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: spacing.lg + Math.max(insets.bottom, 12) },
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigateRoot(navigation, "CreateEditGroup", { cameFrom: "groups" })}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  list: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: FAB_SIZE + spacing.xl + spacing.lg + 8,
  },
  listHeader: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
  listHeaderTitle: {
    ...typography.subhead,
    fontSize: 17,
    fontWeight: "700",
    color: colors.accent,
  },
  listHeaderSub: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 20,
    fontSize: 13,
  },
  separator: {
    height: spacing.xs,
  },
  emptyWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subhead,
    fontSize: 18,
    textAlign: "center",
  },
  emptySub: {
    ...typography.body,
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: 320,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    backgroundColor: colors.primary,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: touch.minWidth + 12,
    minHeight: touch.minHeight + 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
    ...shadows.fab,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    marginTop: -2,
  },
});
