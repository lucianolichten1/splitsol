import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, spacing, typography } from "../constants/theme";
import { useSplits } from "../hooks/useSplits";

export function HistoryScreen() {
  const { splits, refresh } = useSplits();
  const [filter, setFilter] = useState<"all" | "active" | "settled">("all");

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = splits.filter((split) => (filter === "all" ? true : split.status === filter));

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {(["all", "active", "settled"] as const).map((value) => {
          const selected = value === filter;
          return (
            <Pressable
              key={value}
              style={[styles.filterButton, selected && styles.filterButtonSelected]}
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
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>No history yet.</Text>}
        renderItem={({ item }) => <SplitCard split={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.sm,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterButtonSelected: {
    borderColor: colors.accent,
  },
  filterText: {
    ...typography.caption,
    textTransform: "capitalize",
  },
  filterTextSelected: {
    color: colors.accent,
  },
  empty: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
