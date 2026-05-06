import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useProfile } from "../hooks/useProfile";
import { useSplits } from "../hooks/useSplits";
import { netForUserInSplitBalances } from "../lib/balanceSummary";
import { resolveCurrentUserParticipantId } from "../lib/currentUserParticipant";
import { navigateRoot } from "../lib/navigateRoot";
import { RootStackParamList } from "../navigation/RootNavigator";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_OPTIONS: { value: "all" | "active" | "settled"; label: string }[] = [
  { value: "all", label: "All splits" },
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
];

export function HistoryScreen() {
  const navigation = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();
  const { splits, refresh, loading } = useSplits();
  const { profile, refreshProfile } = useProfile();
  const [filter, setFilter] = useState<"all" | "active" | "settled">("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshProfile();
    }, [refresh, refreshProfile])
  );

  const filtered = splits.filter((split) => (filter === "all" ? true : split.status === filter));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenHint}>Filter your splits, then tap a card to open balances and details.</Text>
      <View style={styles.filters}>
        {FILTER_OPTIONS.map(({ value, label }) => {
          const selected = value === filter;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Filter: ${label}`}
              android_ripple={{ color: "#ffffff18" }}
              style={({ pressed }) => [
                styles.filterButton,
                selected && styles.filterButtonSelected,
                pressed && styles.filterButtonPressed,
              ]}
              onPress={() => setFilter(value)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xxl + spacing.md + Math.max(insets.bottom, 8) }]}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} accessibilityLabel="Loading history" />
            </View>
          ) : splits.length === 0 ? (
            <Text style={styles.empty}>No history yet.</Text>
          ) : (
            <Text style={styles.empty}>No splits match this filter.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceElevated,
    minHeight: touch.minHeight,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.cardSubtle,
  },
  filterButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  filterButtonPressed: {
    opacity: 0.9,
  },
  filterText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextSelected: {
    color: colors.accent,
  },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: spacing.xl,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    gap: spacing.md,
  },
  screenHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
});
