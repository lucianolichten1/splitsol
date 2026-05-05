import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { useSplits } from "../hooks/useSplits";
import { navigateRoot } from "../lib/navigateRoot";
import { RootStackParamList } from "../navigation/RootNavigator";

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function HistoryScreen() {
  const navigation = useNavigation<RootNav>();
  const { splits, refresh, loading } = useSplits();
  const [filter, setFilter] = useState<"all" | "active" | "settled">("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = splits.filter((split) => (filter === "all" ? true : split.status === filter));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.filters}>
        {(["all", "active", "settled"] as const).map((value) => {
          const selected = value === filter;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              android_ripple={{ color: "#ffffff18" }}
              style={({ pressed }) => [
                styles.filterButton,
                selected && styles.filterButtonSelected,
                pressed && styles.filterButtonPressed,
              ]}
              onPress={() => setFilter(value)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
        renderItem={({ item }) => (
          <SplitCard
            split={item}
            onPress={() => navigateRoot(navigation, "SplitSummary", { splitId: item.id })}
          />
        )}
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
    textTransform: "capitalize",
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
    paddingBottom: spacing.xxl + spacing.md,
  },
  loadingWrap: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
});
