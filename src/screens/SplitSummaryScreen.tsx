import { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BadgePopup } from "../components/BadgePopup";
import { BalanceRow } from "../components/BalanceRow";
import { colors, spacing, typography } from "../constants/theme";
import { useRewards } from "../hooks/useRewards";
import { useSplits } from "../hooks/useSplits";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SplitSummary">;

export function SplitSummaryScreen({ route }: Props) {
  const { splitId } = route.params;
  const { splits, refresh, markBalanceSettled } = useSplits();
  const { checkAndAwardRewards, newBadge, dismissBadge } = useRewards();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const split = useMemo(() => splits.find((item) => item.id === splitId), [splits, splitId]);

  if (!split) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Split not found.</Text>
      </View>
    );
  }

  const onMarkSettled = async (balanceId: string) => {
    await markBalanceSettled(split.id, balanceId);
    const nextSplits = await refresh();
    await checkAndAwardRewards("balance_settled", nextSplits);

    const refreshedSplit = nextSplits.find((item) => item.id === split.id);
    if (refreshedSplit?.status === "settled") {
      await checkAndAwardRewards("split_fully_settled", nextSplits);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{split.name}</Text>
      <Text style={styles.subtitle}>Total {split.totalAmount.toFixed(2)}</Text>
      <FlatList
        data={split.balances}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.sm }}
        ListEmptyComponent={<Text style={styles.empty}>All settled. No balances remaining.</Text>}
        renderItem={({ item }) => (
          <BalanceRow
            entry={item}
            participants={split.participants}
            onMarkSettled={() => onMarkSettled(item.id)}
          />
        )}
      />
      <BadgePopup badge={newBadge} onClose={dismissBadge} />
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
  title: {
    ...typography.heading,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.caption,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
