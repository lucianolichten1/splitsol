import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing, typography } from "../constants/theme";

const STEPS = [
  "Create a group",
  "Add friends",
  "Add expenses",
  "SplitSol calculates your net balance",
  "Settle manually now — Solana payments coming in Phase 2",
] as const;

export function HowSplitSolWorksCard() {
  return (
    <View style={styles.card} accessible accessibilityLabel="How SplitSol works, five steps">
      <Text style={styles.title}>How SplitSol works</Text>
      {STEPS.map((line, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.bullet}>{i + 1}.</Text>
          <Text style={styles.step}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...shadows.cardSubtle,
  },
  title: {
    ...typography.overline,
    fontSize: 11,
    marginBottom: spacing.xs,
    color: colors.accent,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bullet: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 22,
  },
  step: {
    ...typography.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    fontWeight: "500",
  },
});
