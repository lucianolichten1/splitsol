import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, touch, typography } from "../constants/theme";
import { formatSolAmount } from "../lib/formatMoney";
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

  const pct = expense.participantPercents;
  const splitMeta =
    expense.splitMode === "percentage" && pct
      ? `Split: ${participants.map((p) => `${pct[p.id] ?? 0}%`).join(" · ")}`
      : "Split equally";

  return (
    <View style={styles.row}>
      <View style={styles.accentRule} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {expense.description}
        </Text>
        <Text style={styles.meta}>Paid by {paidLabel}</Text>
        <Text style={styles.metaSplit}>{splitMeta}</Text>
      </View>
      <View style={styles.amountCol}>
        <Text style={styles.amount}>{formatSolAmount(expense.amount)}</Text>
        <Text style={styles.amountUsd}>SOL</Text>
      </View>
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
  metaSplit: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  amountCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  amount: {
    ...typography.subhead,
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent,
  },
  amountUsd: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textDim,
  },
});
