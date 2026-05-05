import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";
import { Split } from "../types";

type Props = {
  split: Split;
  onPress?: () => void;
};

export function SplitCard({ split, onPress }: Props) {
  const unsettledCount = split.balances.filter((entry) => !entry.settled).length;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.name}>{split.name}</Text>
        <Text style={split.status === "settled" ? styles.settled : styles.active}>
          {split.status.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.meta}>
        {split.participants.length} participants • {split.expenses.length} expenses
      </Text>
      <Text style={styles.meta}>
        Total {split.totalAmount.toFixed(2)} • Remaining entries {unsettledCount}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    ...typography.subhead,
  },
  meta: {
    ...typography.caption,
  },
  active: {
    color: colors.warning,
    fontWeight: "700",
    fontSize: 12,
  },
  settled: {
    color: colors.success,
    fontWeight: "700",
    fontSize: 12,
  },
});
