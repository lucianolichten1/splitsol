import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SplitCard } from "../components/SplitCard";
import { colors, layout, radius, shadows, touch, typography } from "../constants/theme";
import { useGroups } from "../hooks/useGroups";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { netForUserInSplitBalances } from "../lib/balanceSummary";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { navigateRoot } from "../lib/navigateRoot";
import { RootStackParamList } from "../navigation/RootNavigator";
import { SplitStatus } from "../types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FAB_SIZE = 60;

const STATUS_OPTIONS: { id: "all" | SplitStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "disputed", label: "Disputed" },
  { id: "settled", label: "Settled" },
];

export function TransactionsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { splits, loading, refresh } = useSplits();
  const { groups, refresh: refreshGroups } = useGroups();
  const { profile, refreshProfile } = useProfile();

  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["id"]>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshGroups();
      refreshProfile();
    }, [refresh, refreshGroups, refreshProfile])
  );

  const filtered = useMemo(() => {
    const sorted = [...splits].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.filter((split) => {
      if (statusFilter !== "all" && split.status !== statusFilter) return false;
      if (groupFilter === "direct" && split.groupId) return false;
      if (groupFilter !== "all" && groupFilter !== "direct" && split.groupId !== groupFilter) return false;
      return true;
    });
  }, [splits, statusFilter, groupFilter]);

  const listBottomPadding = FAB_SIZE + layout.block + layout.scrollBottom + Math.max(insets.bottom, layout.stack);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSub}>splits & expenses</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={filtersOpen ? "Hide filters" : "Show filters"}
          style={({ pressed }) => [styles.filterToggle, pressed && { opacity: 0.88 }]}
          onPress={() => setFiltersOpen((open) => !open)}
        >
          <Text style={styles.filterToggleText}>{filtersOpen ? "Done" : "Filters"}</Text>
        </Pressable>
      </View>

      {filtersOpen ? (
        <>
          <View style={styles.filterRow}>
            {STATUS_OPTIONS.map((opt) => {
              const selected = statusFilter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && { opacity: 0.9 }]}
                  onPress={() => setStatusFilter(opt.id)}
                >
                  <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.groupRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: groupFilter === "all" }}
              style={({ pressed }) => [styles.groupChip, groupFilter === "all" && styles.groupChipSelected, pressed && { opacity: 0.9 }]}
              onPress={() => setGroupFilter("all")}
            >
              <Text style={[styles.groupChipText, groupFilter === "all" && styles.groupChipTextSelected]}>All groups</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: groupFilter === "direct" }}
              style={({ pressed }) => [styles.groupChip, groupFilter === "direct" && styles.groupChipSelected, pressed && { opacity: 0.9 }]}
              onPress={() => setGroupFilter("direct")}
            >
              <Text style={[styles.groupChipText, groupFilter === "direct" && styles.groupChipTextSelected]}>Direct</Text>
            </Pressable>
            {groups.map((group) => {
              const selected = groupFilter === group.id;
              return (
                <Pressable
                  key={group.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.groupChip, selected && styles.groupChipSelected, pressed && { opacity: 0.9 }]}
                  onPress={() => setGroupFilter(group.id)}
                >
                  <Text style={[styles.groupChipText, selected && styles.groupChipTextSelected]} numberOfLines={1}>
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
        ItemSeparatorComponent={() => null}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accentStrong} accessibilityLabel="Loading transactions" />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.empty}>Create one with the + button.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const me = profile ? resolveCurrentUserParticipantId(item.participants, profile) : null;
          const viewerNet = profile ? netForUserInSplitBalances(me, item.balances) : undefined;
          return (
            <SplitCard
              split={item}
              viewerNet={viewerNet}
              onPress={() => navigateRoot(navigation, "SplitSummary", { splitId: item.id })}
            />
          );
        }}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create new transaction"
        android_ripple={{ color: "#00000022" }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: layout.block + Math.max(insets.bottom, layout.stack) },
          pressed && styles.fabPressed,
        ]}
        onPress={() => navigateRoot(navigation, "CreateSplit", {}, false)}
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
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingV,
    gap: layout.block,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: layout.stack,
  },
  titleBlock: {
    flex: 1,
    gap: layout.titleGap,
  },
  filterToggle: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: layout.cardPaddingDense,
    minHeight: touch.minHeight - 8,
    justifyContent: "center",
    marginTop: 4,
  },
  filterToggleText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.accentStrong,
    fontWeight: "700",
  },
  headerTitle: {
    ...typography.screenTitle,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: layout.inline,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: layout.cardPadding,
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  filterChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: "700",
  },
  filterChipTextSelected: {
    color: colors.background,
  },
  groupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: layout.inline,
  },
  groupChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: layout.cardPaddingDense,
    minHeight: touch.minHeight - 8,
    justifyContent: "center",
  },
  groupChipSelected: {
    borderColor: colors.accentStrong,
    backgroundColor: colors.primaryMuted,
  },
  groupChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  groupChipTextSelected: {
    color: colors.text,
  },
  listContent: {
    gap: layout.listGap,
    paddingTop: 0,
  },
  loadingWrap: {
    paddingVertical: layout.scrollBottom,
    alignItems: "center",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    gap: layout.titleGap,
  },
  emptyTitle: {
    ...typography.subhead,
    fontSize: 18,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
  },
  fab: {
    position: "absolute",
    right: layout.screenPaddingH,
    backgroundColor: colors.accent,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    minWidth: touch.minWidth + 12,
    minHeight: touch.minHeight + 12,
    borderWidth: 2,
    borderColor: "rgba(7,19,17,0.14)",
    ...shadows.fab,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: colors.background,
    fontSize: 34,
    fontWeight: "700",
    marginTop: -2,
  },
});
