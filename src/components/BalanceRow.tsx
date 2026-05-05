import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";
import { BalanceEntry, Participant } from "../types";

type Props = {
  entry: BalanceEntry;
  participants: Participant[];
  onMarkSettled?: () => void;
};

export function BalanceRow({ entry, participants, onMarkSettled }: Props) {
  const from = participants.find((p) => p.id === entry.from)?.nickname ?? "Unknown";
  const to = participants.find((p) => p.id === entry.to)?.nickname ?? "Unknown";

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>
          {from} owes {to}
        </Text>
        <Text style={styles.amount}>{entry.amount.toFixed(2)}</Text>
      </View>
      {entry.settled ? (
        <Text style={styles.settled}>Settled</Text>
      ) : (
        <Pressable style={styles.button} onPress={onMarkSettled}>
          <Text style={styles.buttonText}>Mark Settled</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  text: {
    ...typography.body,
  },
  amount: {
    ...typography.subhead,
    color: colors.accent,
  },
  settled: {
    color: colors.success,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  buttonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
});
