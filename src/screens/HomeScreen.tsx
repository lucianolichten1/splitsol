import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SplitCard } from "../components/SplitCard";
import { colors, radius, spacing, typography } from "../constants/theme";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useSplits } from "../hooks/useSplits";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { activeSplits, outstandingTotal, refresh } = useSplits();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Outstanding Balance</Text>
        <Text style={styles.summaryAmount}>{outstandingTotal.toFixed(2)}</Text>
      </View>

      <FlatList
        data={activeSplits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No active splits yet. Tap + to create one.</Text>}
        renderItem={({ item }) => (
          <SplitCard
            split={item}
            onPress={() => navigation.navigate("SplitSummary", { splitId: item.id })}
          />
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate("CreateSplit")}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.caption,
  },
  summaryAmount: {
    ...typography.heading,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: 100,
  },
  empty: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
});
