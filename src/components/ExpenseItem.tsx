import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";
import { Expense, Participant } from "../types";

type Props = {
  expense: Expense;
  participants: Participant[];
};

export function ExpenseItem({ expense, participants }: Props) {
  const payer = participants.find((p) => p.id === expense.paidBy);

  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>{expense.description}</Text>
        <Text style={styles.meta}>Paid by {payer?.nickname ?? "Unknown"}</Text>
      </View>
      <Text style={styles.amount}>{expense.amount.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.body,
    fontWeight: "600",
  },
  meta: {
    ...typography.caption,
  },
  amount: {
    ...typography.subhead,
    color: colors.accent,
  },
});
