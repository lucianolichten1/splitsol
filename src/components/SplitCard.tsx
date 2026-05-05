import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { Split } from "../types";

type Props = {
  split: Split;
  onPress?: () => void;
};

export function SplitCard({ split, onPress }: Props) {
  const balances = Array.isArray(split.balances) ? split.balances : [];
  const unsettledCount = balances.filter((entry) => !entry.settled).length;
  const isSettled = split.status === "settled";
  const participantCount = Array.isArray(split.participants) ? split.participants.length : 0;
  const expenseCount = Array.isArray(split.expenses) ? split.expenses.length : 0;
  const totalAmount = typeof split.totalAmount === "number" ? split.totalAmount : 0;

  const body = (
    <>
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={2}>
          {split.name}
        </Text>
        <View style={[styles.statusPill, isSettled ? styles.statusPillSettled : styles.statusPillActive]}>
          <Text style={isSettled ? styles.settled : styles.active}>{split.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {participantCount} participants · {expenseCount} expenses
      </Text>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{totalAmount.toFixed(2)}</Text>
      </View>
      <View style={styles.openLine}>
        {unsettledCount === 0 ? (
          <Text style={styles.openDone}>All balances closed</Text>
        ) : (
          <View style={styles.openRow}>
            <Text style={styles.openAccent}>{unsettledCount}</Text>
            <Text style={styles.openMuted}>
              {" "}
              open balance{unsettledCount !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens split details"
        android_ripple={{ color: "#ffffff18" }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={onPress}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.card}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: touch.minHeight + spacing.xl,
    ...shadows.cardSubtle,
  },
  cardPressed: {
    opacity: 0.94,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  name: {
    ...typography.subhead,
    fontSize: 17,
    flex: 1,
    marginRight: spacing.sm,
    letterSpacing: -0.2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: touch.minHeight - 6,
    justifyContent: "center",
  },
  statusPillActive: {
    backgroundColor: colors.warningMuted,
    borderColor: colors.warning,
  },
  statusPillSettled: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  totalLabel: {
    ...typography.overline,
    fontSize: 10,
    marginBottom: 0,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: -0.5,
  },
  openLine: {
    marginTop: 2,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  openAccent: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.warning,
  },
  openMuted: {
    ...typography.caption,
    fontSize: 13,
  },
  openDone: {
    ...typography.caption,
    fontSize: 13,
    color: colors.success,
    fontWeight: "600",
  },
  active: {
    color: colors.warning,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  settled: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
