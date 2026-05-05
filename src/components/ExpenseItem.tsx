import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { Expense, Participant } from "../types";

type Props = {
  expense: Expense;
  participants: Participant[];
  currentUserParticipantId?: string | null;
};

export function ExpenseItem({ expense, participants, currentUserParticipantId }: Props) {
  const payer = participants.find((p) => p.id === expense.paidBy);
  const isYou = currentUserParticipantId && expense.paidBy === currentUserParticipantId;
  const paidLabel = isYou ? "you" : payer?.nickname ?? "Unknown";

  return (
    <View style={styles.row}>
      <View style={styles.accentRule} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {expense.description}
        </Text>
        <Text style={styles.meta}>Paid by {paidLabel}</Text>
      </View>
      <Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.minHeight + spacing.sm,
    ...shadows.cardSubtle,
  },
  accentRule: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    minHeight: 40,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    fontSize: 16,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
  },
  amount: {
    ...typography.subhead,
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
});
